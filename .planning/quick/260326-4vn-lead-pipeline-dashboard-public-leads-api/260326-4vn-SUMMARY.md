---
phase: quick
plan: 260326-4vn
subsystem: leads-api, dashboard
tags: [pipeline, api-keys, rate-limiting, kanban, dashboard]
dependency_graph:
  requires: [customer-onboarding, billing]
  provides: [pipeline-dashboard, public-leads-api]
  affects: [dashboard.tsx, server/index.ts]
tech_stack:
  added: []
  patterns: [hono-middleware, in-memory-rate-limit, bearer-token-auth, kanban-ui]
key_files:
  created:
    - apps/server/src/routes/pipeline.ts
    - apps/server/src/routes/leads.ts
  modified:
    - apps/server/src/index.ts
    - apps/web/src/routes/dashboard.tsx
decisions:
  - "maskApiKey applied to stored keyHash (not plain key, which is never stored) as visual identifier"
  - "Rate limiting uses in-memory Map with sliding 60s window — resets on server restart (acceptable for MVP)"
  - "Pipeline stats polling at 30s interval; initial stages/api-keys loaded once on mount"
metrics:
  duration: "~3.5 minutes"
  completed: "2026-03-26"
  tasks_completed: 3
  files_changed: 4
---

# Phase quick Plan 260326-4vn: Lead Pipeline Dashboard + Public Leads API Summary

Pipeline Kanban dashboard UI (5 stages, stats bar, CSV download, API key management) plus authenticated public REST API (Bearer token + in-memory rate limiting per plan tier).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Pipeline API endpoints (session auth) | 545d8aa | apps/server/src/routes/pipeline.ts, apps/server/src/index.ts |
| 2 | Public Leads API (API key auth + rate limiting) | 72a931d | apps/server/src/routes/leads.ts, apps/server/src/index.ts |
| 3 | Lead Pipeline Dashboard UI | 1124b94 | apps/web/src/routes/dashboard.tsx |

## What Was Built

### Pipeline API (`/api/pipeline/*`)
- `GET /pipeline/stats` — totalLeads, scoredToday, emailsSent, replyRate, pipelineValue (€12/lead)
- `GET /pipeline/stages` — leads grouped by stage with top-5 preview per stage
- `GET /pipeline/csv` — CSV download with Content-Disposition header
- `GET /pipeline/api-keys` — masked API key list
- `POST /pipeline/api-keys/rotate` — delete old key, generate new, return plain key once

### Public Leads API (`/api/leads/*`)
- `GET /leads` — paginated leads with X-Total-Count header, min_score filter
- `GET /leads/:id/score` — single lead with score factors
- `POST /leads/export` — CSV export via API key
- `apiKeyMiddleware` — Bearer token extraction, sha256 hash lookup, rate limit check
- `checkRateLimit()` — in-memory sliding 60s window, 100/500/2000 req/min per plan

### Dashboard UI (`/dashboard`)
- Stats bar: 5 metric cards (Total Leads, Scored Today, Emails Sent, Reply Rate, Pipeline Value)
- Pipeline Kanban: 5 columns (new/scored/enriched/pitched/replied) with lead previews + score badges
- API Key Management: masked keys, Rotate button, one-time plain key reveal Dialog
- Download CSV button opens `/api/pipeline/csv` in new tab
- 30s polling for pipeline stats; initial load for stages + api-keys
- All existing sections (Services, System Info, Activity Log, Billing) preserved below

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] apps/server/src/routes/pipeline.ts — exists
- [x] apps/server/src/routes/leads.ts — exists
- [x] Commit 545d8aa — verified
- [x] Commit 72a931d — verified
- [x] Commit 1124b94 — verified
