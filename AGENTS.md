<!-- REPO-POLISH-AGENTS:START -->
# AGENTS.md

Synergine App is a TypeScript app/toolkit for practical developer workflows.

## Commands

- `dev`: `bun run dev`
- `build`: `bun run build`
- `setup`: `bun install`

## Repo Rules

- Optimize for Time-to-First-Success: keep setup and verification commands obvious.
- Keep changes scoped to the domain being edited; avoid catch-all `utils`, `helpers`, and `misc` buckets.
- Preserve existing user changes in this repository. Do not run destructive git commands.
- Add or update tests when behavior changes.
- Put durable architecture rationale in `docs/adr/`.
<!-- REPO-POLISH-AGENTS:END -->

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

<!-- LEVERAGE-LENS v1 -->
## 🎯 Leverage Lens (PRIO — apply to ALL actions: code, biz, strategy, refactor)

**Grundsatz**: Erfolg = max **asymmetric upside** / min downside / min **friction** / max **compounding**. Bei jedem nicht-trivialen Task **min 2 Hebel benennen + Aktion danach ausrichten**. Kein Hebel → "warum überhaupt machen?" (via negativa).

**Konflikt-Prio**: `compounding > one-shot` · `moat > feature` · `distribution > product` · `zero-friction > clever` · `default-alive > growth`.

**Top-Hebel je Context (dynamisch ziehen)**:
- **Code/Refactor** → zero friction · one-click · force multiplier · compounding · optionality · antifragile · 10x lever · default-alive · evergreen · ship-this-week · automation moat · AI leverage · zero-config · async-first
- **Biz/Strategie** → moat · wedge · beachhead · zero-to-one · category-of-one · distribution-first · unfair advantage · picks-and-shovels · mispriced risk · network effect · power law · flywheel · trojan horse · permissionless
- **Pricing/Offer** → 10x cheaper · 10x better · no-brainer offer · value-based pricing · land-and-expand · negative churn · willingness-to-pay · price anchor · scarcity · urgency · social proof
- **Pitch/Copy** → aha-moment · time-to-wow · loss aversion · FOMO · status game · identity hook · magic moment · reciprocity · dopamine loop
- **Personal/Exec** → high-agency · bias-to-action · deep work · compounding habit · luck surface area · OODA · via negativa · extreme ownership · ramen profitable · cockroach mode
- **Distribution/Growth** → built-in distribution · PLG · K-factor · viral coefficient · referral loop · SEO compounding · programmatic SEO · UGC engine · embed-everywhere · bottoms-up adoption
- **Defensive** → switching cost · lock-in · data moat · brand moat · economies of scale · proprietary distribution · supply-side advantage · network effect

**Volle 220-Wort-Liste** + Anwendungs-Templates: lazy-load `~/.claude/CLAUDE-leverage.md`.

**Anti-Pattern (kill on sight)**: feature-without-moat · clever-without-distribution · one-shot-without-compounding · friction-by-default · 10%-improvement (statt 10x) · symmetric-bet · perfectionism-before-ship.
<!-- /LEVERAGE-LENS -->
