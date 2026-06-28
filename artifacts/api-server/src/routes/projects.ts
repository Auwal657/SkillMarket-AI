import { Router } from "express";
import { eq, ilike, or, sql, and, inArray } from "drizzle-orm";
import { db, projectsTable, usersTable, applicationsTable, notificationsTable, freelancerProfilesTable } from "@workspace/db";
import { CreateProjectBody, UpdateProjectBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

async function enrichProjects(projects: typeof projectsTable.$inferSelect[]) {
  if (projects.length === 0) return [];

  const clientIds = [...new Set(projects.map(p => p.clientId))];
  const projectIds = projects.map(p => p.id);

  const [clients, appCounts] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(inArray(usersTable.id, clientIds)),
    db.select({ projectId: applicationsTable.projectId, count: sql<number>`count(*)` })
      .from(applicationsTable)
      .where(inArray(applicationsTable.projectId, projectIds))
      .groupBy(applicationsTable.projectId),
  ]);

  const clientMap = new Map(clients.map(c => [c.id, c.name]));
  const countMap = new Map(appCounts.map(a => [a.projectId, Number(a.count)]));

  return projects.map(p => ({
    ...p,
    clientName: clientMap.get(p.clientId) ?? null,
    applicationCount: countMap.get(p.id) ?? 0,
  }));
}

router.get("/my", requireAuth, requireRole("client"), async (req, res) => {
  const projects = await db.select().from(projectsTable)
    .where(eq(projectsTable.clientId, req.user!.userId))
    .orderBy(sql`${projectsTable.createdAt} DESC`);

  res.json(await enrichProjects(projects));
});

router.get("/", async (req, res) => {
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string || "20", 10), 100);
  const offset = parseInt(req.query.offset as string || "0", 10);

  let query = db.select().from(projectsTable).$dynamic();

  const conditions = [];
  if (category) conditions.push(ilike(projectsTable.category, `%${category}%`));
  if (search) conditions.push(or(ilike(projectsTable.title, `%${search}%`), ilike(projectsTable.description, `%${search}%`))!);
  if (status) conditions.push(eq(projectsTable.status, status as "open" | "in_progress" | "completed" | "cancelled"));

  if (conditions.length > 0) {
    query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
  }

  const projects = await query.orderBy(sql`${projectsTable.createdAt} DESC`).limit(limit).offset(offset);
  res.json(await enrichProjects(projects));
});

router.post("/", requireAuth, requireRole("client"), async (req, res) => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  if (parsed.data.budgetMin > parsed.data.budgetMax) {
    res.status(400).json({ error: "budgetMin must be ≤ budgetMax" }); return;
  }

  const [project] = await db.insert(projectsTable).values({
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    budgetMin: parsed.data.budgetMin,
    budgetMax: parsed.data.budgetMax,
    timelineWeeks: parsed.data.timelineWeeks ?? null,
    requiredSkills: parsed.data.requiredSkills ?? [],
    clientId: req.user!.userId,
  }).returning();

  const [client] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.user!.userId));
  res.status(201).json({ ...project, clientName: client?.name ?? null, applicationCount: 0 });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [[client], [appCount]] = await Promise.all([
    db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, project.clientId)),
    db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.projectId, id)),
  ]);

  res.json({ ...project, clientName: client?.name ?? null, applicationCount: Number(appCount?.count ?? 0) });
});

router.patch("/:id", requireAuth, requireRole("client"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.clientId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.budgetMin !== undefined) updates.budgetMin = parsed.data.budgetMin;
  if (parsed.data.budgetMax !== undefined) updates.budgetMax = parsed.data.budgetMax;
  if (parsed.data.timelineWeeks !== undefined) updates.timelineWeeks = parsed.data.timelineWeeks;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.requiredSkills !== undefined) updates.requiredSkills = parsed.data.requiredSkills;

  const budgetMin = (updates.budgetMin ?? project.budgetMin) as number;
  const budgetMax = (updates.budgetMax ?? project.budgetMax) as number;
  if (budgetMin > budgetMax) { res.status(400).json({ error: "budgetMin must be ≤ budgetMax" }); return; }

  const [updated] = Object.keys(updates).length > 0
    ? await db.update(projectsTable).set(updates).where(eq(projectsTable.id, id)).returning()
    : [project];

  const [[client], [appCount]] = await Promise.all([
    db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.clientId)),
    db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.projectId, id)),
  ]);
  res.json({ ...updated, clientName: client?.name ?? null, applicationCount: Number(appCount?.count ?? 0) });
});

// Mark a project as completed — transitions in_progress → completed
// Notifies the accepted freelancer so they can leave a review request
router.patch("/:id/complete", requireAuth, requireRole("client"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.clientId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  if (project.status !== "in_progress") {
    res.status(400).json({ error: "Only in-progress projects can be marked complete" }); return;
  }

  const [updated] = await db.update(projectsTable)
    .set({ status: "completed" })
    .where(eq(projectsTable.id, id))
    .returning();

  // Find the accepted freelancer and notify them
  const [acceptedApp] = await db.select({ freelancerId: applicationsTable.freelancerId, proposedRate: applicationsTable.proposedRate })
    .from(applicationsTable)
    .where(and(eq(applicationsTable.projectId, id), eq(applicationsTable.status, "accepted")));

  if (acceptedApp) {
    // Update freelancer completedProjects counter if not already counted
    const [fp] = await db.select({ id: freelancerProfilesTable.id })
      .from(freelancerProfilesTable)
      .where(eq(freelancerProfilesTable.userId, acceptedApp.freelancerId));

    if (fp) {
      await db.update(freelancerProfilesTable)
        .set({ completedProjects: sql`${freelancerProfilesTable.completedProjects} + 1` })
        .where(eq(freelancerProfilesTable.id, fp.id));
    }

    await db.insert(notificationsTable).values({
      userId: acceptedApp.freelancerId,
      type: "project_completed",
      title: "Project completed! 🏆",
      message: `"${project.title}" has been marked complete by the client`,
      link: `/applications`,
    }).catch(() => {});

    // Notify client they can now leave a review
    await db.insert(notificationsTable).values({
      userId: req.user!.userId,
      type: "project_completed",
      title: "Project completed",
      message: `Great work! You can now leave a review for the freelancer`,
      link: `/freelancers`,
    }).catch(() => {});
  }

  const [[client], [appCount]] = await Promise.all([
    db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.clientId)),
    db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.projectId, id)),
  ]);

  res.json({ ...updated, clientName: client?.name ?? null, applicationCount: Number(appCount?.count ?? 0) });
});

router.delete("/:id", requireAuth, requireRole("client"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select({ clientId: projectsTable.clientId }).from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.clientId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.json({ message: "Project deleted" });
});

router.get("/:projectId/applications", requireAuth, requireRole("client"), async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "Invalid projectId" }); return; }

  const [project] = await db.select({ clientId: projectsTable.clientId, title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.clientId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const applications = await db.select().from(applicationsTable)
    .where(eq(applicationsTable.projectId, projectId))
    .orderBy(sql`${applicationsTable.createdAt} DESC`);

  if (applications.length === 0) { res.json([]); return; }

  const freelancerIds = [...new Set(applications.map(a => a.freelancerId))];
  const [freelancers, freelancerProfiles] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(inArray(usersTable.id, freelancerIds)),
    db.select({ userId: freelancerProfilesTable.userId, headline: freelancerProfilesTable.headline })
      .from(freelancerProfilesTable).where(inArray(freelancerProfilesTable.userId, freelancerIds)),
  ]);

  const nameMap = new Map(freelancers.map(f => [f.id, f.name]));
  const headlineMap = new Map(freelancerProfiles.map(f => [f.userId, f.headline]));

  const result = applications.map(app => ({
    ...app,
    freelancerName: nameMap.get(app.freelancerId) ?? null,
    freelancerHeadline: headlineMap.get(app.freelancerId) ?? null,
    projectTitle: project.title,
  }));

  res.json(result);
});

export default router;
