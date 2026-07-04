# SkillMarket AI

A freelance marketplace connecting African students and freelancers with global clients.

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS 4, served on port 5000
- **Backend**: Express 5 + TypeScript (`tsx watch`), served on port 8080
- **Database**: PostgreSQL via Drizzle ORM (Replit's built-in DB)
- **Auth**: JWT (httpOnly cookies) + bcryptjs
- **Realtime**: Socket.IO
- **Payments**: Paystack escrow system (dev mode simulates when `PAYSTACK_SECRET_KEY` absent)
- **Email**: Resend (optional)
- **Monorepo**: pnpm workspaces

## Workspace layout

```
artifacts/
  api-server/   — Express API (port 8080)
  skillmarket/  — React frontend (port 5000)
lib/
  api-client-react/  — Generated React Query hooks (orval)
  api-spec/          — OpenAPI spec
  api-zod/           — Zod schemas
  db/                — Drizzle schema + migrations
```

## How to run

Two workflows must be running:
1. **Backend API** — `cd artifacts/api-server && pnpm dev`
2. **Start application** — `cd artifacts/skillmarket && pnpm dev`

## Required secrets

| Secret | Purpose |
|--------|---------|
| `JWT_SECRET` | Signs authentication tokens (any long random string) |
| `PAYSTACK_SECRET_KEY` | Payment processing (optional — dev mode simulates payments without it) |
| `RESEND_API_KEY` | Transactional email (optional) |

## Database

Schema is managed by Drizzle. To push schema changes to the dev DB:
```
pnpm --filter @workspace/db push
```

## User preferences

- Keep the existing monorepo structure (pnpm workspaces, `artifacts/` and `lib/` layout).
