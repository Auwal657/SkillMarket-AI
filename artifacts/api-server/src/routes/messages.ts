import { Router } from "express";
import { eq, or, and, sql } from "drizzle-orm";
import { db, conversationsTable, messagesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { z } from "zod";

const router = Router();

const SendMessageBody = z.object({
  recipientId: z.number().int().positive(),
  content: z.string().min(1).max(5000),
});

router.get("/conversations", requireAuth, async (req, res) => {
  const uid = req.user!.userId;
  const conversations = await db.select().from(conversationsTable)
    .where(or(eq(conversationsTable.participant1Id, uid), eq(conversationsTable.participant2Id, uid)))
    .orderBy(sql`${conversationsTable.lastMessageAt} DESC`);

  const result = await Promise.all(conversations.map(async (c) => {
    const otherId = c.participant1Id === uid ? c.participant2Id : c.participant1Id;
    const [other] = await db.select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl, role: usersTable.role })
      .from(usersTable).where(eq(usersTable.id, otherId));
    const [lastMsg] = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, c.id))
      .orderBy(sql`${messagesTable.createdAt} DESC`).limit(1);
    const [{ count: unread }] = await db.select({ count: sql<number>`count(*)` }).from(messagesTable)
      .where(and(eq(messagesTable.conversationId, c.id), eq(messagesTable.isRead, false), sql`${messagesTable.senderId} != ${uid}`));
    return { ...c, otherUser: other ?? null, lastMessage: lastMsg ?? null, unreadCount: Number(unread) };
  }));

  res.json(result);
});

router.get("/:conversationId", requireAuth, async (req, res) => {
  const conversationId = parseInt(req.params.conversationId, 10);
  if (isNaN(conversationId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const uid = req.user!.userId;

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (conv.participant1Id !== uid && conv.participant2Id !== uid) { res.status(403).json({ error: "Forbidden" }); return; }

  // Mark as read
  await db.update(messagesTable).set({ isRead: true })
    .where(and(eq(messagesTable.conversationId, conversationId), sql`${messagesTable.senderId} != ${uid}`));

  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(sql`${messagesTable.createdAt} ASC`);

  res.json(messages);
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const uid = req.user!.userId;
  const { recipientId, content } = parsed.data;
  if (uid === recipientId) { res.status(400).json({ error: "Cannot message yourself" }); return; }

  const p1 = Math.min(uid, recipientId);
  const p2 = Math.max(uid, recipientId);

  let [conv] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.participant1Id, p1), eq(conversationsTable.participant2Id, p2)));

  if (!conv) {
    [conv] = await db.insert(conversationsTable).values({ participant1Id: p1, participant2Id: p2 }).returning();
  }

  const [message] = await db.insert(messagesTable).values({
    conversationId: conv.id,
    senderId: uid,
    content,
  }).returning();

  await db.update(conversationsTable).set({ lastMessageAt: new Date() }).where(eq(conversationsTable.id, conv.id));

  res.status(201).json({ ...message, conversationId: conv.id });
});

export default router;
