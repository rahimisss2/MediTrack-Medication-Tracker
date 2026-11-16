# MediTrack

An English-language personal medication schedule and dose tracker.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- The first release is a single-device browser app. Medication schedules, profile, and dose logs stay in local browser storage; there is no account or cross-device sync.
- Camera capture is a photo demonstration, not pill identification. Never show fabricated verification, confidence scores, or a recommendation to take a photographed medication.
- Logging a dose requires an explicit user confirmation, not merely uploading a photo.

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

- All application language must be English.
- For the Streamlit demo, use an English voice reminder (`en-US`) at speech rate `0.9`, and keep the visible interface in English.
- Preserve the existing premium dark green React UI when adding functionality. The Streamlit demo and live React app are separate implementations; update both when requested, without replacing the live React app with Streamlit.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
