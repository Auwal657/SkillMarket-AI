import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, savedItemsTable, projectsTable, freelancerProfilesTable, usersTable, applicationsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { z } from "zod";

const router = Router();

const SaveBody = z.object({
  itemType: z.enum(["project", "freelancer"]),
  itemId: z.number().int().positive(),
});

router.get("/projects", requireAuth, async (req, res) => {
  const saved = await db.select().from(savedItemsTable)
    .where(and(eq(savedItemsTable.userId, req.user!.userId), eq(savedItemsTable.itemType, "project")));

  const projectIds = saved.map(s => s.itemId);
  if (projectIds.length === 0) { res.json([]); return; }

  const projects = await Promise.all(projectIds.map(async (pid) => {
    const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, pid));
    if (!p) return null;
    const [client] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, p.clientId));
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.projectId, p.id));
    return { ...p, clientName: client?.name ?? null, applicationCount: Number(count) };
  }));

  res.json(projects.filter(Boolean));
});

router.get("/freelancers", requireAuth, async (req, res) => {
  const saved = await db.select().from(savedItemsTable)
    .where(and(eq(savedItemsTable.userId, req.user!.userId), eq(savedItemsTable.itemType, "freelancer")));

  const profileIds = saved.map(s => s.itemId);
  if (profileIds.length === 0) { res.json([]); return; }

  const freelancers = await Promise.all(profileIds.map(async (pid) => {
    const [p] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.id, pid));
    if (!p) return null;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId));
    return { ...p, user };
  }));

  res.json(freelancers.filter(Boolean));
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

router.delete("/", requireAuth, async (req, res) => {
  const parsed = SaveBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

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
