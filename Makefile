# =============================================================================
# Synergine App — Development Makefile
# =============================================================================
# Usage:
#   make dev              Start full stack (infra + app)
#   make stop             Stop all services
#   make status           Show service status
#   make logs             Stream Docker logs
#   make health           Check all service health endpoints
#   make monitoring       Start with Langfuse + Uptime Kuma
#   make dashboard        Start with Dozzle (Docker log viewer)
#   make build            Build frontend + backend
#   make test             Run tests
#   make db-shell         Connect to SurrealDB SQL shell
#   make help             Show this help message
# =============================================================================

.PHONY: help dev stop status logs health monitoring dashboard build test db-shell
.PHONY: ps ps-all infra app clean colima

# Color output
RED := \033[0;31m
GREEN := \033[0;32m
CYAN := \033[0;36m
NC := \033[0m

help:
	@echo "$(CYAN)Synergine — Makefile Targets$(NC)"
	@echo ""
	@grep -E '^\s+[a-z-]+\s+' Makefile | head -30

# --- Core Development ---

dev:
	@./dev.sh

stop:
	@./dev.sh stop

status:
	@./dev.sh status

ps:
	@docker compose ps

ps-all:
	@docker compose --profile search --profile monitoring --profile dashboard --profile gateway ps

infra:
	@./dev.sh infra

app:
	@./dev.sh app

# --- Infrastructure Management ---

logs:
	@docker compose logs -f

health:
	@echo "$(CYAN)Checking service health...$(NC)"
	@echo ""
	@echo "$(GREEN)SurrealDB$(NC)"
	@curl -s http://localhost:8000/health | jq . || echo "$(RED)UNHEALTHY$(NC)"
	@echo ""
	@echo "$(GREEN)Dragonfly (Redis)$(NC)"
	@docker exec synergine-dragonfly redis-cli -a synergine ping || echo "$(RED)UNHEALTHY$(NC)"
	@echo ""
	@echo "$(GREEN)NATS$(NC)"
	@curl -s http://localhost:8222/healthz | head -5 || echo "$(RED)UNHEALTHY$(NC)"
	@echo ""
	@echo "$(GREEN)Meilisearch (if running)$(NC)"
	@curl -s http://localhost:7700/health | jq . 2>/dev/null || echo "Not running"
	@echo ""
	@echo "$(GREEN)Langfuse (if running)$(NC)"
	@curl -s http://localhost:3100/api/health 2>/dev/null | jq . || echo "Not running"
	@echo ""
	@echo "$(GREEN)Dozzle (if running)$(NC)"
	@curl -s http://localhost:9999 -o /dev/null -w "%{http_code}\n" 2>/dev/null || echo "Not running"

monitoring:
	@./dev.sh monitoring

dashboard:
	@./dev.sh dashboard

# --- Service Profiles ---

search-on:
	@echo "$(GREEN)Starting Meilisearch...$(NC)"
	@docker compose --profile search up -d meilisearch
	@echo "Meilisearch → http://localhost:7700"

monitoring-on:
	@echo "$(GREEN)Starting Langfuse + Uptime Kuma...$(NC)"
	@docker compose --profile monitoring up -d
	@echo "Langfuse:    http://localhost:3100"
	@echo "Uptime Kuma: http://localhost:3200"

dashboard-on:
	@echo "$(GREEN)Starting Dozzle...$(NC)"
	@docker compose --profile dashboard up -d dozzle
	@echo "Dozzle → http://localhost:9999"

gateway-on:
	@echo "$(GREEN)Starting Caddy (reverse proxy)...$(NC)"
	@docker compose --profile gateway up -d caddy
	@echo "Caddy → http://localhost (+ https://localhost)"

# --- Build & Test ---

build:
	@echo "$(GREEN)Building...$(NC)"
	@bun run build

test:
	@echo "$(GREEN)Running tests...$(NC)"
	@bun run test

# --- Database ---

db-shell:
	@echo "$(CYAN)Connecting to SurrealDB...$(NC)"
	@docker exec -it synergine-surrealdb surreal sql \
		--username root \
		--password synergine \
		--namespace ns \
		--database db

db-export:
	@echo "$(CYAN)Exporting SurrealDB backup...$(NC)"
	@docker exec synergine-surrealdb surreal export --username root --password synergine rocksdb:/data/surreal.db > backup.json
	@echo "$(GREEN)Backup saved to backup.json$(NC)"

# --- Runtime Management ---

colima-start:
	@echo "$(GREEN)Starting Colima with optimized settings...$(NC)"
	@colima start \
		--vm-type vz \
		--arch aarch64 \
		--cpu 8 \
		--memory 16 \
		--disk 60 \
		--mount-type virtiofs \
		--vz-rosetta \
		--runtime docker

colima-stop:
	@echo "$(CYAN)Stopping Colima...$(NC)"
	@colima stop

colima-status:
	@colima status

# --- Cleanup ---

clean:
	@echo "$(RED)Cleaning up containers and volumes...$(NC)"
	@docker compose --profile search --profile monitoring --profile dashboard --profile gateway down -v
	@echo "$(GREEN)Done.$(NC)"

clean-all: clean
	@echo "$(RED)Removing all Docker images...$(NC)"
	@docker system prune -a --force
	@echo "$(GREEN)Done.$(NC)"

# --- Development Shortcuts ---

logs-surrealdb:
	@docker compose logs -f surrealdb

logs-dragonfly:
	@docker compose logs -f dragonfly

logs-nats:
	@docker compose logs -f nats

logs-app:
	@bun run dev 2>&1 | grep -E "Ready|ERROR|warning" || bun run dev

# --- Quick Start ---

quickstart: colima-start dev

quickstart-monitoring: colima-start monitoring

# --- Debug ---

docker-stats:
	@docker stats --no-stream

env-check:
	@echo "$(CYAN)Checking .env configuration...$(NC)"
	@[ -f .env ] && echo "$(GREEN).env exists$(NC)" || echo "$(RED).env missing - run: cp env.example .env$(NC)"
	@echo ""
	@echo "$(CYAN)Key variables:$(NC)"
	@grep -E '^(NODE_ENV|PORT|SURREALDB|DRAGONFLY|NATS)' .env || true

version-check:
	@echo "$(CYAN)Environment versions:$(NC)"
	@echo "Bun:  $$(bun --version)"
	@echo "Node: $$(node --version)"
	@echo "Docker: $$(docker --version)"
	@command -v colima &>/dev/null && echo "Colima: $$(colima version)" || echo "Colima: not installed"
