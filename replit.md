# SkillMarket AI

A freelance marketplace platform connecting African students and freelancers with global clients. Features include project browsing, talent profiles, applications, real-time messaging, escrow payments, and wallet management.

## Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Wouter, TanStack Query, Framer Motion — runs on port 5000
- **Backend**: Express 5, TypeScript, tsx, Socket.io, Drizzle ORM, Pino — runs on port 8080
- **Database**: PostgreSQL (Replit managed), schema managed via Drizzle
- **Payments**: Paystack (escrow)
- **Email**: Resend

## Monorepo layout

```
artifacts/
  api-server/     Express backend
  skillmarket/    React frontend
lib/
  db/             Drizzle schema + client
  api-spec/       OpenAPI spec
  api-zod/        Generated Zod types
  api-client-react/ Generated TanStack Query hooks
scripts/          Seed scripts
```

## Running the project

Two workflows run in parallel:
- **Backend API**: `cd artifacts/api-server && pnpm dev` (port 8080)
- **Start application**: `cd artifacts/skillmarket && pnpm dev` (port 5000)

### First-time setup

1. Install dependencies: `pnpm install` (from repo root)
2. Push DB schema: `cd lib/db && pnpm run push`
3. Set required secrets (see below)

## Required environment variables / secrets

| Key | Required | Notes |
|-----|----------|-------|
| `JWT_SECRET` | ✅ Yes | Long random string for signing auth tokens |
| `DATABASE_URL` | Auto | Managed by Replit |
| `PAYSTACK_SECRET_KEY` | Optional | Payment processing; dev mode simulates payments when absent |
| `RESEND_API_KEY` | Optional | Transactional email |
| `FROM_EMAIL` | Optional | Sender address for emails |
| `APP_URL` | Required in production | Public URL for Paystack callback links |

## User preferences

<!-- Add user preferences here as requested -->
