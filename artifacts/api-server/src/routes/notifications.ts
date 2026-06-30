import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  // P7: Add pagination — default to 50 most recent; client can override with ?limit & ?offset
  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);

  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.userId))
    .orderBy(sql`${notificationsTable.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
  res.json(notifications);
});

// B3: /read-all MUST be registered BEFORE /:id/read so Express doesn't match
// "read-all" as an :id parameter and return 404
router.patch("/read-all", requireAuth, async (req, res) => {
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, req.user!.userId));
  res.json({ message: "All notifications marked as read" });
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [notif] = await db.select({ userId: notificationsTable.userId }).from(notificationsTable).where(eq(notificationsTable.id, id));
  if (!notif) { res.status(404).json({ error: "Not found" }); return; }
  if (notif.userId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id));
  res.json({ message: "Marked as read" });
});

export default router;
