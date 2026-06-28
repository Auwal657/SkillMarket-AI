import { Router } from "express";
import { eq, or, and, sql, inArray } from "drizzle-orm";
import { db, conversationsTable, messagesTable, usersTable, notificationsTable } from "@workspace/db";
import { requireAuth, requireEmailVerified } from "../lib/auth";
import { z } from "zod";

const router = Router();

const SendMessageBody = z.object({
  recipientId: z.number().int().positive(),
  content: z.string().min(1).max(2000),
});

router.get("/conversations", requireAuth, async (req, res) => {
  const uid = req.user!.userId;
  const conversations = await db.select().from(conversationsTable)
    .where(or(eq(conversationsTable.participant1Id, uid), eq(conversationsTable.participant2Id, uid)))
    .orderBy(sql`${conversationsTable.lastMessageAt} DESC`);

  if (conversations.length === 0) { res.json([]); return; }

  const otherIds = conversations.map(c => c.participant1Id === uid ? c.participant2Id : c.participant1Id);
  const uniqueOtherIds = [...new Set(otherIds)];
  const conversationIds = conversations.map(c => c.id);

  const [otherUsers, lastMessages, unreadCounts] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl, role: usersTable.role })
      .from(usersTable).where(inArray(usersTable.id, uniqueOtherIds)),

    db.select().from(messagesTable)
      .where(inArray(messagesTable.conversationId, conversationIds))
      .orderBy(sql`${messagesTable.conversationId}, ${messagesTable.createdAt} DESC`),

    db.select({
      conversationId: messagesTable.conversationId,
      count: sql<number>`count(*)`,
    }).from(messagesTable)
      .where(and(
        inArray(messagesTable.conversationId, conversationIds),
        eq(messagesTable.isRead, false),
        sql`${messagesTable.senderId} != ${uid}`
      ))
      .groupBy(messagesTable.conversationId),
  ]);

  const userMap = new Map(otherUsers.map(u => [u.id, u]));
  const unreadMap = new Map(unreadCounts.map(u => [u.conversationId, Number(u.count)]));

  const lastMsgMap = new Map<number, typeof lastMessages[0]>();
  for (const msg of lastMessages) {
    if (!lastMsgMap.has(msg.conversationId)) lastMsgMap.set(msg.conversationId, msg);
  }

  const result = conversations.map((c, i) => ({
    ...c,
    otherUser: userMap.get(otherIds[i]) ?? null,
    lastMessage: lastMsgMap.get(c.id) ?? null,
    unreadCount: unreadMap.get(c.id) ?? 0,
  }));

  res.json(result);
});

router.get("/:conversationId", requireAuth, async (req, res) => {
  const conversationId = parseInt(req.params.conversationId, 10);
  if (isNaN(conversationId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const uid = req.user!.userId;

  const limit = Math.min(parseInt(req.query.limit as string || "50", 10), 200);
  const offset = parseInt(req.query.offset as string || "0", 10);

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversationId));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (conv.participant1Id !== uid && conv.participant2Id !== uid) { res.status(403).json({ error: "Forbidden" }); return; }

  // Mark incoming messages as read
  await db.update(messagesTable).set({ isRead: true })
    .where(and(eq(messagesTable.conversationId, conversationId), sql`${messagesTable.senderId} != ${uid}`));

  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(sql`${messagesTable.createdAt} ASC`)
    .limit(limit)
    .offset(offset);

  res.json(messages);
});

router.post("/", requireAuth, requireEmailVerified, async (req, res) => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" }); return; }

  const uid = req.user!.userId;
  const { recipientId, content } = parsed.data;
  if (uid === recipientId) { res.status(400).json({ error: "Cannot message yourself" }); return; }

  // Verify recipient exists
  const [recipient] = await db.select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable).where(eq(usersTable.id, recipientId));
  if (!recipient) { res.status(404).json({ error: "Recipient not found" }); return; }

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

  // Notify recipient of new message
  const [sender] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, uid));
  const preview = content.length > 60 ? content.slice(0, 60) + "…" : content;
  await db.insert(notificationsTable).values({
    userId: recipientId,
    type: "new_message",
    title: `New message from ${sender?.name ?? "someone"}`,
    message: preview,
    link: `/messages`,
  }).catch(() => {});

  res.status(201).json({ ...message, conversationId: conv.id });
});

export default router;
