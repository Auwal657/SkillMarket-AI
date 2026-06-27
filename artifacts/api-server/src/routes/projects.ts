import { Router } from "express";
import { eq, ilike, or, sql, and } from "drizzle-orm";
import { db, projectsTable, usersTable, applicationsTable } from "@workspace/db";
import { CreateProjectBody, UpdateProjectBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

function buildProject(project: Record<string, unknown>, clientName: string | null, applicationCount = 0) {
  return { ...project, clientName, applicationCount };
}

// /my must come before /:id
router.get("/my", requireAuth, requireRole("client"), async (req, res) => {
  const projects = await db.select().from(projectsTable).where(eq(projectsTable.clientId, req.user!.userId))
    .orderBy(sql`${projectsTable.createdAt} DESC`);

  const result = await Promise.all(projects.map(async (p) => {
    const [client] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, p.clientId));
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.projectId, p.id));
    return buildProject(p as Record<string, unknown>, client?.name ?? null, Number(count));
  }));

  res.json(result);
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

  const result = await Promise.all(projects.map(async (p) => {
    const [client] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, p.clientId));
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.projectId, p.id));
    return buildProject(p as Record<string, unknown>, client?.name ?? null, Number(count));
  }));

  res.json(result);
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
  res.status(201).json(buildProject(project as Record<string, unknown>, client?.name ?? null, 0));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [client] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, project.clientId));
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.projectId, id));

  res.json(buildProject(project as Record<string, unknown>, client?.name ?? null, Number(count)));
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

  const [client] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.clientId));
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.projectId, id));
  res.json(buildProject(updated as Record<string, unknown>, client?.name ?? null, Number(count)));
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

  const [project] = await db.select({ clientId: projectsTable.clientId }).from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.clientId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const applications = await db.select().from(applicationsTable).where(eq(applicationsTable.projectId, projectId))
    .orderBy(sql`${applicationsTable.createdAt} DESC`);

  const result = await Promise.all(applications.map(async (app) => {
    const [freelancer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, app.freelancerId));
    const [projectData] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, app.projectId));
    return { ...app, freelancerName: freelancer?.name ?? null, freelancerHeadline: null, projectTitle: projectData?.title ?? null };
  }));

  res.json(result);
});

export default router;
