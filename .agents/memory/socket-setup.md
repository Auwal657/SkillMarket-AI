---
name: Socket.IO setup
description: How Socket.IO is wired into the Express backend and React frontend, including auth cookie parsing and fallback strategy.
---

## Backend (`artifacts/api-server/src/lib/socket.ts`)
- `http.createServer(app)` wraps Express; `httpServer.listen(PORT)` replaces `app.listen(PORT)`.
- Socket.IO auth middleware manually parses `cookie` header from `socket.handshake.headers.cookie` — cookie-parser does NOT run in the socket context.
- Cookie name is `auth_token` (matches `COOKIE_NAME` in `auth.ts`).
- Socket handler is in `lib/socket.ts`, imported and called as `initSocket(httpServer)` in `index.ts`.
- Messages sent via socket are also persisted to DB and emit notifications.

## Frontend (`artifacts/skillmarket/src/pages/MessagesPage.tsx`)
- Module-level singleton `_socket` created once via `getSocket()` — avoids duplicate connections on re-renders.
- Socket connects to `/` with `path: "/socket.io"`.
- Vite proxy in `vite.config.ts` proxies `/socket.io` to `http://localhost:8080` with `ws: true`.
- Falls back to REST polling (3s messages, 10s conversations) when socket is disconnected.
- Emits `join:conversation` / `leave:conversation` on active conv change.
- Emits `conversation:read` to mark messages read.

## Admin dashboard
- `isAdmin: boolean` column added to `usersTable` in `lib/db/src/schema/users.ts`, pushed via `pnpm push`.
- Backend: `artifacts/api-server/src/routes/admin.ts` — checks admin via DB query (not JWT payload).
- Frontend: `artifacts/skillmarket/src/pages/admin/AdminDashboard.tsx` — checks `/api/admin/me` on load; shows Access Denied if not admin.
- Route: `/admin` added to `App.tsx` wrapped in `<ProtectedRoute>`.

**Why:** Admin status stored in DB (not JWT) so it can be toggled without re-login.
