import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { verifyToken } from "./auth";
import { logger } from "./logger";
import { db, messagesTable, conversationsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

export let io: SocketIOServer;

// In-memory presence tracking: userId -> Set of socket IDs
const onlineUsers = new Map<number, Set<string>>();

export function getOnlineUserIds(): number[] {
  return [...onlineUsers.keys()];
}

export function isUserOnline(userId: number): boolean {
  const sockets = onlineUsers.get(userId);
  return !!sockets && sockets.size > 0;
}

export function initSocket(httpServer: HttpServer) {
  // Resolution order:
  //   1. ALLOWED_ORIGINS env var (explicit, comma-separated)
  //   2. REPLIT_DOMAINS (auto-set by Replit on every deployment)
  //   3. null → allow all origins (safe for local / dev)
  let allowedOrigins: string[] | null = null;
  if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins = process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  } else if (process.env.REPLIT_DOMAINS) {
    allowedOrigins = process.env.REPLIT_DOMAINS.split(",")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => (d.startsWith("http") ? d : `https://${d}`));
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins ?? true,
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

    // Track presence
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);

    // Announce user came online to everyone
    socket.broadcast.emit("presence:online", { userId });

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
        if (conv.p1 !== userId && conv.p2 !== userId) return;
        socket.join(`conv:${conversationId}`);
      } catch (err) {
        logger.error(err, "join:conversation error");
      }
    });

    // Leave a conversation room
    socket.on("leave:conversation", (conversationId: number) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Typing indicators
    socket.on("typing:start", ({ conversationId }: { conversationId: number }) => {
      socket.to(`conv:${conversationId}`).emit("typing:start", { userId, conversationId });
    });

    socket.on("typing:stop", ({ conversationId }: { conversationId: number }) => {
      socket.to(`conv:${conversationId}`).emit("typing:stop", { userId, conversationId });
    });

    // Send a message (optionally with attachment)
    socket.on("message:send", async ({
      recipientId,
      content,
      attachmentUrl,
      attachmentName,
      attachmentType,
    }: {
      recipientId: number;
      content: string;
      attachmentUrl?: string;
      attachmentName?: string;
      attachmentType?: string;
    }) => {
      const hasContent = content?.trim();
      const hasAttachment = attachmentUrl?.trim();
      if (!hasContent && !hasAttachment) return;
      if (!recipientId) return;
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
          .values({
            conversationId: conv.id,
            senderId: userId,
            content: content?.trim() ?? "",
            attachmentUrl: attachmentUrl ?? null,
            attachmentName: attachmentName ?? null,
            attachmentType: attachmentType ?? null,
          })
          .returning();

        await db
          .update(conversationsTable)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversationsTable.id, conv.id));

        // Stop typing indicator on send
        socket.to(`conv:${conv.id}`).emit("typing:stop", { userId, conversationId: conv.id });

        // Emit to everyone in the conversation room
        io.to(`conv:${conv.id}`).emit("message:new", {
          ...message,
          conversationId: conv.id,
        });

        // Emit conversation update to both participants
        io.to(`user:${userId}`).to(`user:${recipientId}`).emit("conversation:updated", {
          conversationId: conv.id,
        });

        const [sender] = await db
          .select({ name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, userId));

        const preview = hasContent
          ? (content.length > 60 ? content.slice(0, 60) + "…" : content)
          : `📎 ${attachmentName ?? "file"}`;

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

        io.to(`conv:${conversationId}`).emit("conversation:seen", {
          conversationId,
          byUserId: userId,
        });
      } catch (err) {
        logger.error(err, "Error marking messages read");
      }
    });

    // Presence: respond to queries about who is online
    socket.on("presence:query", (userIds: number[]) => {
      const result: Record<number, boolean> = {};
      for (const uid of userIds) {
        result[uid] = isUserOnline(uid);
      }
      socket.emit("presence:status", result);
    });

    socket.on("disconnect", () => {
      logger.info({ userId }, "Socket disconnected");
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          // Announce offline only when last socket closes
          socket.broadcast.emit("presence:offline", { userId });
        }
      }
    });
  });

  return io;
}
