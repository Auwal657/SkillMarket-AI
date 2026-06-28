import { Router } from "express";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db, savedItemsTable, projectsTable, freelancerProfilesTable, usersTable, applicationsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { z } from "zod";

const router = Router();

const SaveBody = z.object({
  itemType: z.enum(["project", "freelancer"]),
  itemId: z.number().int().positive(),
});

// B6: Query-param schema for DELETE (request bodies on DELETE are unreliable)
const DeleteQuerySchema = z.object({
  itemType: z.enum(["project", "freelancer"]),
  itemId: z.coerce.number().int().positive(),
});

router.get("/projects", requireAuth, async (req, res) => {
  const saved = await db.select().from(savedItemsTable)
    .where(and(eq(savedItemsTable.userId, req.user!.userId), eq(savedItemsTable.itemType, "project")));

  const projectIds = saved.map(s => s.itemId);
  if (projectIds.length === 0) { res.json([]); return; }

  // P1: Batch all lookups — 3 queries instead of N*2
  const [projects, clients, appCounts] = await Promise.all([
    db.select().from(projectsTable).where(inArray(projectsTable.id, projectIds)),
    db.select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(inArray(usersTable.id,
        (await db.select({ clientId: projectsTable.clientId }).from(projectsTable).where(inArray(projectsTable.id, projectIds))).map(p => p.clientId)
      )),
    db.select({ projectId: applicationsTable.projectId, count: sql<number>`count(*)` })
      .from(applicationsTable).where(inArray(applicationsTable.projectId, projectIds)).groupBy(applicationsTable.projectId),
  ]);

  const clientMap = new Map(clients.map(c => [c.id, c.name]));
  const countMap = new Map(appCounts.map(a => [a.projectId, Number(a.count)]));

  const result = projects.map(p => ({
    ...p,
    clientName: clientMap.get(p.clientId) ?? null,
    applicationCount: countMap.get(p.id) ?? 0,
  }));

  res.json(result);
});

router.get("/freelancers", requireAuth, async (req, res) => {
  const saved = await db.select().from(savedItemsTable)
    .where(and(eq(savedItemsTable.userId, req.user!.userId), eq(savedItemsTable.itemType, "freelancer")));

  const profileIds = saved.map(s => s.itemId);
  if (profileIds.length === 0) { res.json([]); return; }

  // P1: Batch
  const profiles = await db.select().from(freelancerProfilesTable).where(inArray(freelancerProfilesTable.id, profileIds));
  const userIds = profiles.map(p => p.userId);
  const users = userIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  const result = profiles.map(p => ({ ...p, user: userMap.get(p.userId) ?? null }));
  res.json(result);
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = SaveBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  await db.insert(savedItemsTable).values({
    userId: req.user!.userId,
    itemType: parsed.data.itemType,
    itemId: parsed.data.itemId,
  }).onConflictDoNothing();

  res.status(201).json({ message: "Saved" });
});

// B6: Accept itemType and itemId as query params, not request body
// DELETE requests with bodies are unreliable (blocked by some browsers/proxies)
router.delete("/", requireAuth, async (req, res) => {
  const parsed = DeleteQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "itemType and itemId are required query parameters" });
    return;
  }

  await db.delete(savedItemsTable).where(
    and(
      eq(savedItemsTable.userId, req.user!.userId),
      eq(savedItemsTable.itemType, parsed.data.itemType),
      eq(savedItemsTable.itemId, parsed.data.itemId),
    )
  );
  res.json({ message: "Removed from saved" });
});

router.get("/check", requireAuth, async (req, res) => {
  const itemType = req.query.itemType as string;
  const itemId = parseInt(req.query.itemId as string, 10);
  if (!itemType || isNaN(itemId)) { res.status(400).json({ error: "itemType and itemId required" }); return; }

  const [saved] = await db.select({ id: savedItemsTable.id }).from(savedItemsTable)
    .where(and(eq(savedItemsTable.userId, req.user!.userId), eq(savedItemsTable.itemType, itemType), eq(savedItemsTable.itemId, itemId)));
  res.json({ saved: !!saved });
});

export default router;
