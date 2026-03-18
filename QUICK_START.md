# Synergine App — Quick Start Guide

## TL;DR — Start Everything in 30 Seconds

```bash
cd /Users/master/synergine-app
make dev
```

Then open:
- **API:** http://localhost:3001
- **Frontend:** http://localhost:5173
- **SurrealDB:** http://localhost:8000
- **NATS Monitor:** http://localhost:8222

---

## Common Commands

### Infrastructure

```bash
make dev                  # Start everything (infra + app)
make stop                 # Stop all services
make status               # Show running containers
make logs                 # Stream all logs
```

### Monitoring & Debugging

```bash
make health               # Check all service health (with curl)
make monitoring           # Start with Langfuse + Uptime Kuma
make dashboard            # Start Dozzle (Docker logs viewer)
make docker-stats         # Real-time container resource usage
```

### Database

```bash
make db-shell             # Connect to SurrealDB SQL shell
make db-export            # Backup database to backup.json
```

### Development

```bash
make build                # Build frontend + backend
make test                 # Run tests
make app                  # Start app only (infra already running)
```

### Colima (Container Runtime)

```bash
make colima-start         # Start Colima (auto-starts if missing)
make colima-stop          # Stop Colima VM
make colima-status        # Check Colima status
```

### Debugging

```bash
make env-check            # Verify .env configuration
make version-check        # Show tool versions (Bun, Node, Docker, Colima)
make logs-surrealdb       # Logs from specific service
```

---

## Profile Combinations

### Minimal (Core Only)
```bash
docker compose up -d
```
**Services:** SurrealDB, Dragonfly, NATS

### With Search
```bash
docker compose --profile search up -d
```
**Adds:** Meilisearch (full-text search on port 7700)

### With Monitoring ⭐ Recommended for Development
```bash
make monitoring
```
**Adds:** Langfuse (http://localhost:3100) + Uptime Kuma (http://localhost:3200)

### With Real-time Logs
```bash
make dashboard
```
**Adds:** Dozzle (http://localhost:9999) — browse logs from all containers

### Production-like Setup (with reverse proxy)
```bash
docker compose --profile gateway up -d
```
**Adds:** Caddy (HTTP/HTTPS reverse proxy on ports 80/443)

### Everything
```bash
docker compose --profile search --profile monitoring --profile dashboard --profile gateway up -d
```

---

## First-Time Setup

### 1. Create .env from template
```bash
cp env.example .env
```

### 2. Start infrastructure
```bash
make dev
```
*Or just infra:*
```bash
make infra
```

### 3. Verify everything is running
```bash
make health
```

### 4. (Optional) Add monitoring
```bash
docker compose --profile monitoring up -d
# Visit Langfuse: http://localhost:3100
# Visit Uptime Kuma: http://localhost:3200
```

---

## Troubleshooting

### Docker not found
```bash
# If Colima isn't running, auto-start it
make colima-start

# Or manually
colima start --vm-type vz --arch aarch64 --cpu 8 --memory 16 --disk 60 --mount-type virtiofs --vz-rosetta --runtime docker
```

### Containers won't start
```bash
# Check health of all services
make health

# Check full container logs
make logs

# Check specific service
make logs-surrealdb
```

### Out of memory / high CPU
```bash
# See real-time resource usage
make docker-stats

# If needed, restart
make stop
sleep 2
make dev
```

### Check what's running
```bash
make ps              # All running containers
make docker-stats    # Resource usage
make status          # Docker + bun processes
```

---

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **App** | http://localhost:3001 | Hono API backend |
| **Frontend** | http://localhost:5173 | React development server |
| **SurrealDB** | http://localhost:8000 | Multi-model database |
| **SurrealDB Studio** | http://localhost:8000/studio | Web UI |
| **NATS Monitor** | http://localhost:8222 | Message broker monitoring |
| **Meilisearch** | http://localhost:7700 | Full-text search (if enabled) |
| **Langfuse** | http://localhost:3100 | LLM observability (if enabled) |
| **Uptime Kuma** | http://localhost:3200 | Health monitoring (if enabled) |
| **Dozzle** | http://localhost:9999 | Docker logs (if enabled) |

---

## Default Credentials

| Service | User | Password | Change In |
|---------|------|----------|-----------|
| SurrealDB | root | synergine | .env / production |
| Dragonfly | — | synergine | .env / production |
| Langfuse | — | (auto-setup) | .env / production |

**DO NOT use in production.** Set strong secrets in .env before deploying.

---

## File Locations

```
/Users/master/synergine-app/
├── Makefile                 # Development commands (make dev, make stop, etc.)
├── dev.sh                   # Startup script (./dev.sh, ./dev.sh monitoring)
├── docker-compose.yml       # Docker services definition
├── env.example              # Template for .env (copy and customize)
├── INFRA_OPTIMIZATION.md    # Detailed optimization guide
├── QUICK_START.md           # This file
└── apps/
    ├── server/              # Hono API (port 3001)
    └── web/                 # React frontend (port 5173)
```

---

## Performance Tips

1. **Use Colima with virtiofs** (faster file I/O)
   - Auto-enabled in `make dev`

2. **Allocate enough CPU/RAM**
   - Default: 8 CPU, 16GB RAM (recommended)
   - Adjust in Makefile → `colima start` command if needed

3. **Use `make health` before starting app**
   - Ensures all services are ready
   - Prevents connection timeout errors

4. **Monitor resource usage**
   - `make docker-stats` shows real-time usage
   - Stop unused services to free memory

5. **Use specific `make logs-*` commands**
   - `make logs` streams everything (can be noisy)
   - `make logs-surrealdb` shows one service only

---

## Next Steps

1. Start development: `make dev`
2. Open http://localhost:5173 in browser
3. Check logs if anything goes wrong: `make logs`
4. Add monitoring when needed: `make monitoring`

**Need more help?** See `INFRA_OPTIMIZATION.md` for comprehensive docs.
