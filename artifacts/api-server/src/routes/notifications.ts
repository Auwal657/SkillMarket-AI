import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.userId))
    .orderBy(sql`${notificationsTable.createdAt} DESC`).limit(50);
  res.json(notifications);
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [notif] = await db.select({ userId: notificationsTable.userId }).from(notificationsTable).where(eq(notificationsTable.id, id));
  if (!notif) { res.status(404).json({ error: "Not found" }); return; }
  if (notif.userId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id));
  res.json({ message: "Marked as read" });
});

router.patch("/read-all", requireAuth, async (req, res) => {
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, req.user!.userId));
  res.json({ message: "All notifications marked as read" });
});

export default router;
