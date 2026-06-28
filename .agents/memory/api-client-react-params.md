---
name: api-client-react params
description: How ListProjectsParams and other param types are defined; no rebuild needed for edits.
---

The `@workspace/api-client-react` package lives at `artifacts/skillmarket/node_modules/@workspace/api-client-react`.

Its `package.json` exports `"."` → `"./src/index.ts"` directly, so Vite resolves TypeScript source without a dist build step. Editing `src/generated/api.schemas.ts` is immediately live in the dev server.

**ListProjectsParams** is defined in `src/generated/api.schemas.ts`. As of the feature build, it includes:
`category`, `search`, `status`, `budgetMin`, `budgetMax`, `skills`, `limit`, `offset`.

The generated `getListProjectsUrl` uses `URLSearchParams` and appends all non-undefined entries automatically, so adding new fields to the type is sufficient — no changes to `api.ts` needed.

**Why:** The code-gen adds params types to the schema file separately from the API client logic. Any new backend filter param must be added to the schema type to get TypeScript coverage on the frontend.

**How to apply:** When adding new query filters to a backend route, add them to the corresponding `XxxParams` type in `api.schemas.ts` in the source (not dist).
