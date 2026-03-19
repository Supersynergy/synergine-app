# AGENTS.md — Synergine App

## Build & Run
- `bun install` — install deps
- `bun run dev` or `make dev` — start everything (Colima + Docker + Turborepo)
- `bun run build` — production build
- `bun run check` — Biome lint + format

## Stack
- **API**: Hono 4.12 on Bun (apps/server, port 3001)
- **Frontend**: React 19 + TanStack Router (apps/web, port 5173)
- **Auth**: Better Auth 1.5.5 (packages/auth)
- **DB**: SurrealDB 3.0 + Drizzle ORM (packages/db)
- **Cache**: Dragonfly 1.36 (Redis-compatible, port 6390)
- **Messaging**: NATS 2.12 JetStream (port 4222)
- **Search**: Meilisearch 1.38 (port 7700)
- **Styling**: Tailwind v4.2 + shadcn/ui
- **Animation**: Motion 12 + GSAP (free)
- **Payments**: Polar (MoR)
- **Email**: Resend + React Email

## Code Style
- TypeScript strict mode everywhere
- Hono RPC for type-safe API calls (no tRPC needed)
- Zod for runtime validation
- Biome 2.4 for linting + formatting (not ESLint/Prettier)
- Conventional commits: feat:, fix:, docs:, chore:

## Testing
- `bun run test` — Vitest
- Write tests for all API routes
- Use Playwright for E2E

## Monorepo Structure
- `apps/server` — Hono API
- `apps/web` — React SPA
- `packages/auth` — Better Auth config
- `packages/db` — Drizzle schema + SurrealDB
- `packages/env` — Zod-validated env vars
- `packages/ui` — shadcn/ui components
- `packages/config` — shared config + i18n

## Infrastructure
- Docker via Colima (macOS) or Docker Engine (Linux)
- `./dev.sh` or `make dev` starts everything
- Profiles: core, monitoring (Langfuse + Uptime Kuma), dashboard (Dozzle)

## Security
- Never commit .env files
- Use packages/env for type-safe env validation
- Sanitize all user input via Zod schemas
- API auth via Better Auth middleware
