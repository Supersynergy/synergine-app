# Synergine App — Claude Code Instructions

@import ../AGENTS.md

## Claude-Specific
- Use Hono RPC pattern (export type AppType), not tRPC
- Prefer `bun run` over `npm run`
- Use TanStack Router file-based routing (routes auto-generate)
- shadcn/ui components in packages/ui/src/components/
- Run `bun run check` before suggesting commits

## Model Routing (for agents)
- Haiku: file search, grep, simple edits
- Sonnet: code generation, refactoring, reviews
- Opus: architecture decisions, complex planning

## Key Paths
- API routes: apps/server/src/routes/
- Pages: apps/web/src/routes/
- DB schema: packages/db/src/schema/
- Auth config: packages/auth/src/index.ts
- Env vars: packages/env/src/server.ts
