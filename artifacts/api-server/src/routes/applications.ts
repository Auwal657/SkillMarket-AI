import { Router } from "express";
import { eq, sql, inArray, and, ne } from "drizzle-orm";
import {
  db, applicationsTable, projectsTable, usersTable,
  freelancerProfilesTable, notificationsTable,
} from "@workspace/db";
import { ApplyToProjectBody, UpdateApplicationStatusBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

// P1: Batch query helper — resolve project titles for a list of applications
async function attachProjectTitles(applications: typeof applicationsTable.$inferSelect[]) {
  if (applications.length === 0) return [];
  const projectIds = [...new Set(applications.map(a => a.projectId))];
  const projects = await db.select({ id: projectsTable.id, title: projectsTable.title })
    .from(projectsTable).where(inArray(projectsTable.id, projectIds));
  const titleMap = new Map(projects.map(p => [p.id, p.title]));
  return applications.map(app => ({
    ...app,
    projectTitle: titleMap.get(app.projectId) ?? null,
    freelancerName: null,
    freelancerHeadline: null,
  }));
}

router.get("/my", requireAuth, requireRole("freelancer"), async (req, res) => {
  const applications = await db.select().from(applicationsTable)
    .where(eq(applicationsTable.freelancerId, req.user!.userId))
    .orderBy(sql`${applicationsTable.createdAt} DESC`);

  // P1: Single batch query instead of N individual queries
  res.json(await attachProjectTitles(applications));
});

router.post("/", requireAuth, requireRole("freelancer"), async (req, res) => {
  const parsed = ApplyToProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  if (parsed.data.proposedRate <= 0) { res.status(400).json({ error: "proposedRate must be positive" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, parsed.data.projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.status !== "open") { res.status(400).json({ error: "Project is not accepting applications" }); return; }
  if (project.clientId === req.user!.userId) { res.status(400).json({ error: "You cannot apply to your own project" }); return; }

  const existing = await db.select({ id: applicationsTable.id }).from(applicationsTable)
    .where(and(
      eq(applicationsTable.projectId, parsed.data.projectId),
      eq(applicationsTable.freelancerId, req.user!.userId)
    ));
  if (existing.length > 0) { res.status(409).json({ error: "Already applied to this project" }); return; }

  const [app] = await db.insert(applicationsTable).values({
    projectId: parsed.data.projectId,
    freelancerId: req.user!.userId,
    coverLetter: parsed.data.coverLetter,
    proposedRate: parsed.data.proposedRate,
  }).returning();

  // Notify client
  await db.insert(notificationsTable).values({
    userId: project.clientId,
    type: "new_application",
    title: "New application received",
    message: `Someone applied to your project "${project.title}"`,
    link: `/dashboard/projects/${project.id}/applications`,
  }).catch(() => {});

  res.status(201).json({ ...app, projectTitle: project.title, freelancerName: null, freelancerHeadline: null });
});

router.delete("/:id", requireAuth, requireRole("freelancer"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }
  if (app.freelancerId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (app.status !== "pending") { res.status(400).json({ error: "Can only withdraw pending applications" }); return; }

  await db.delete(applicationsTable).where(eq(applicationsTable.id, id));
  res.json({ message: "Application withdrawn" });
});

router.patch("/:id/status", requireAuth, requireRole("client"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateApplicationStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, app.projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.clientId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  // B4: Guard against re-processing an already-decided application
  if (app.status === parsed.data.status) {
    const [freelancer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, app.freelancerId));
    const [fp] = await db.select({ headline: freelancerProfilesTable.headline }).from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, app.freelancerId));
    return res.json({ ...app, projectTitle: project.title, freelancerName: freelancer?.name ?? null, freelancerHeadline: fp?.headline ?? null });
  }

  const [updated] = await db.update(applicationsTable).set({ status: parsed.data.status }).where(eq(applicationsTable.id, id)).returning();

  if (parsed.data.status === "accepted") {
    await db.update(projectsTable).set({ status: "in_progress" }).where(eq(projectsTable.id, project.id));

    // B1: Auto-reject all other pending applications for this project
    const siblingPendingIds = await db
      .select({ id: applicationsTable.id, freelancerId: applicationsTable.freelancerId })
      .from(applicationsTable)
      .where(and(
        eq(applicationsTable.projectId, project.id),
        eq(applicationsTable.status, "pending"),
        ne(applicationsTable.id, id)
      ));

    if (siblingPendingIds.length > 0) {
      await db.update(applicationsTable)
        .set({ status: "rejected" })
        .where(inArray(applicationsTable.id, siblingPendingIds.map(s => s.id)));

      // Notify each auto-rejected freelancer
      const notifValues = siblingPendingIds.map(s => ({
        userId: s.freelancerId,
        type: "application_rejected",
        title: "Application update",
        message: `Your application to "${project.title}" was not selected`,
        link: `/applications`,
      }));
      await db.insert(notificationsTable).values(notifValues).catch(() => {});
    }

    // B4: Only update earnings if the application was previously pending
    if (app.status === "pending") {
      const [fpRow] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable)
        .where(eq(freelancerProfilesTable.userId, app.freelancerId));
      if (fpRow) {
        await db.update(freelancerProfilesTable).set({
          totalEarnings: sql`${freelancerProfilesTable.totalEarnings} + ${app.proposedRate}`,
          completedProjects: sql`${freelancerProfilesTable.completedProjects} + 1`,
        }).where(eq(freelancerProfilesTable.id, fpRow.id));
      }
    }

    await db.insert(notificationsTable).values({
      userId: app.freelancerId,
      type: "application_accepted",
      title: "Application accepted! 🎉",
      message: `Your application to "${project.title}" was accepted`,
      link: `/applications`,
    }).catch(() => {});
  } else if (parsed.data.status === "rejected") {
    await db.insert(notificationsTable).values({
      userId: app.freelancerId,
      type: "application_rejected",
      title: "Application update",
      message: `Your application to "${project.title}" was not selected`,
      link: `/applications`,
    }).catch(() => {});
  }

  // B7: Fetch actual freelancer headline instead of returning null
  const [freelancer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, app.freelancerId));
  const [fp] = await db.select({ headline: freelancerProfilesTable.headline }).from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, app.freelancerId));
  res.json({ ...updated, projectTitle: project.title, freelancerName: freelancer?.name ?? null, freelancerHeadline: fp?.headline ?? null });
});

export default router;
