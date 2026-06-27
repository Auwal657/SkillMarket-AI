import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import {
  db, applicationsTable, projectsTable, usersTable,
  freelancerProfilesTable, notificationsTable,
} from "@workspace/db";
import { ApplyToProjectBody, UpdateApplicationStatusBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get("/my", requireAuth, requireRole("freelancer"), async (req, res) => {
  const applications = await db.select().from(applicationsTable)
    .where(eq(applicationsTable.freelancerId, req.user!.userId))
    .orderBy(sql`${applicationsTable.createdAt} DESC`);

  const result = await Promise.all(applications.map(async (app) => {
    const [project] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, app.projectId));
    return { ...app, projectTitle: project?.title ?? null, freelancerName: null, freelancerHeadline: null };
  }));

  res.json(result);
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
    .where(sql`${applicationsTable.projectId} = ${parsed.data.projectId} AND ${applicationsTable.freelancerId} = ${req.user!.userId}`);
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

  const [updated] = await db.update(applicationsTable).set({ status: parsed.data.status }).where(eq(applicationsTable.id, id)).returning();

  // If accepted: update project status to in_progress, update freelancer earnings, notify freelancer
  if (parsed.data.status === "accepted") {
    await db.update(projectsTable).set({ status: "in_progress" }).where(eq(projectsTable.id, project.id));

    const [fpRow] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable)
      .where(eq(freelancerProfilesTable.userId, app.freelancerId));
    if (fpRow) {
      await db.update(freelancerProfilesTable).set({
        totalEarnings: sql`${freelancerProfilesTable.totalEarnings} + ${app.proposedRate}`,
        completedProjects: sql`${freelancerProfilesTable.completedProjects} + 1`,
      }).where(eq(freelancerProfilesTable.id, fpRow.id));
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

  const [freelancer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, app.freelancerId));
  res.json({ ...updated, projectTitle: project.title, freelancerName: freelancer?.name ?? null, freelancerHeadline: null });
});

export default router;
