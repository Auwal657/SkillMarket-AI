# SkillMarket AI

A student talent discovery and freelance marketplace — students offer their skills as freelancers, clients post projects, and AI match scores surface the best fits.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000 / internal 8080)
- `pnpm --filter @workspace/skillmarket run dev` — run the frontend (port 20998)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed-skills` — seed the skills table
- Required env: `DATABASE_URL` — Postgres connection string; `SESSION_SECRET` — for future session use

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter routing, shadcn/ui, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken), token stored in localStorage, passed as Bearer header
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts (30+ endpoints)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas used in API routes
- `lib/db/src/schema/` — Drizzle ORM table schemas (users, freelancer_profiles, skills, portfolio, projects, applications)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, freelancers, skills, portfolio, projects, applications, dashboard)
- `artifacts/api-server/src/lib/auth.ts` — JWT sign/verify + requireAuth middleware
- `artifacts/skillmarket/src/pages/` — Frontend pages
- `artifacts/skillmarket/src/contexts/AuthContext.tsx` — Auth state, uses `setAuthTokenGetter` from `@workspace/api-client-react`

## Architecture decisions

- **Contract-first API**: OpenAPI spec defines all types; Orval generates both the React Query hooks AND Zod validation schemas from one source
- **JWT in localStorage**: Bearer token injected via `setAuthTokenGetter` in the Orval custom-fetch client — no cookies needed
- **Orval hook signatures**: params-taking hooks (`useListFreelancers`, `useListProjects`) take params as their **first positional argument**, not inside an options object. When using `enabled`, always pass `queryKey` too.
- **AI recommendations**: Computed server-side by skill-matching freelancer's skills against project `requiredSkills` — no external AI API needed
- **DB enums**: `user_role`, `availability_status`, `proficiency_level`, `project_status`, `application_status` defined as Postgres enums via Drizzle

## Product

- Register/login as freelancer or client
- Freelancers: create profile, add skills (from seeded skill catalog), add portfolio items, browse and apply to projects
- Clients: post projects with budget/timeline/required skills, review applications, accept/reject
- Both: browse marketplace (with AI match scores for freelancers), browse freelancer directory
- Dashboards: freelancer dashboard (earnings, applications, profile views); client dashboard (projects, applications received)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Orval hooks with `enabled`**: must also pass `queryKey` explicitly, e.g. `{ query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) } }`
- **Never use `console.log` in server code** — use `req.log` in route handlers and `logger` for non-request code
- **`@workspace/api-zod` exports named schema exports** like `RegisterBody`, `LoginBody`, etc. — use these in route handlers for validation
- **DB push**: after schema changes, run `pnpm --filter @workspace/db run push`; Drizzle will prompt if it detects destructive changes

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
