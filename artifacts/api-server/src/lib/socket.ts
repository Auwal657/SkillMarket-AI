import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cookieParser from "cookie-parser";
import { verifyToken } from "./auth";
import { logger } from "./logger";
import { db, messagesTable, conversationsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

export let io: SocketIOServer;

export function initSocket(httpServer: HttpServer) {
  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : null;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS ?? true,
      credentials: true,
    },
    path: "/socket.io",
  });

  // Auth middleware — read JWT from httpOnly cookie
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((c) => {
      const [k, ...v] = c.trim().split("=");
      if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
    });

    const token = cookies["auth_token"];
    if (!token) return next(new Error("Not authenticated"));

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId: number = socket.data.userId;
    logger.info({ userId }, "Socket connected");

    // User joins their personal room for targeted notifications
    socket.join(`user:${userId}`);

    // Join a conversation room — verify the user is a participant first
    socket.on("join:conversation", async (conversationId: number) => {
      try {
        const [conv] = await db
          .select({ p1: conversationsTable.participant1Id, p2: conversationsTable.participant2Id })
          .from(conversationsTable)
          .where(eq(conversationsTable.id, conversationId));
        if (!conv) return;
        if (conv.p1 !== userId && conv.p2 !== userId) return; // not a participant
        socket.join(`conv:${conversationId}`);
      } catch (err) {
        logger.error(err, "join:conversation error");
      }
    });

    // Leave a conversation room
    socket.on("leave:conversation", (conversationId: number) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Send a message
    socket.on("message:send", async ({ recipientId, content }: { recipientId: number; content: string }) => {
      if (!content?.trim() || !recipientId) return;
      if (userId === recipientId) return;

      try {
        const [recipient] = await db
          .select({ id: usersTable.id, name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, recipientId));
        if (!recipient) return;

        const p1 = Math.min(userId, recipientId);
        const p2 = Math.max(userId, recipientId);

        let [conv] = await db
          .select()
          .from(conversationsTable)
          .where(
            and(
              eq(conversationsTable.participant1Id, p1),
              eq(conversationsTable.participant2Id, p2)
            )
          );

        if (!conv) {
          [conv] = await db
            .insert(conversationsTable)
            .values({ participant1Id: p1, participant2Id: p2 })
            .returning();
        }

        const [message] = await db
          .insert(messagesTable)
          .values({ conversationId: conv.id, senderId: userId, content: content.trim() })
          .returning();

        await db
          .update(conversationsTable)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversationsTable.id, conv.id));

        // Emit to everyone in the conversation room (including sender)
        io.to(`conv:${conv.id}`).emit("message:new", {
          ...message,
          conversationId: conv.id,
        });

        // Emit conversation update to both participants
        io.to(`user:${userId}`).to(`user:${recipientId}`).emit("conversation:updated", {
          conversationId: conv.id,
        });

        // Notify recipient if not in the conversation room
        const [sender] = await db
          .select({ name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, userId));

        const preview = content.length > 60 ? content.slice(0, 60) + "…" : content;
        const [notif] = await db
          .insert(notificationsTable)
          .values({
            userId: recipientId,
            type: "new_message",
            title: `New message from ${sender?.name ?? "someone"}`,
            message: preview,
            link: `/messages`,
          })
          .returning();

        io.to(`user:${recipientId}`).emit("notification:new", notif);
      } catch (err) {
        logger.error(err, "Error handling message:send");
        socket.emit("message:error", { error: "Failed to send message" });
      }
    });

    // Mark messages read in conversation
    socket.on("conversation:read", async (conversationId: number) => {
      try {
        await db
          .update(messagesTable)
          .set({ isRead: true })
          .where(
            and(
              eq(messagesTable.conversationId, conversationId),
              sql`${messagesTable.senderId} != ${userId}`
            )
          );

        // Tell the other participant their messages were read
        io.to(`conv:${conversationId}`).emit("conversation:seen", {
          conversationId,
          byUserId: userId,
        });
      } catch (err) {
        logger.error(err, "Error marking messages read");
      }
    });

    socket.on("disconnect", () => {
      logger.info({ userId }, "Socket disconnected");
    });
  });

  return io;
}
