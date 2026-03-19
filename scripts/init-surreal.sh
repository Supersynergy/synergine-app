#!/usr/bin/env bash
# =============================================================================
# Synergine App — Initialize SurrealDB Schema
# =============================================================================
# Usage:
#   ./scripts/init-surreal.sh          Apply schema only
#   ./scripts/init-surreal.sh --seed   Apply schema + insert demo data
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- Load env ---
if [[ -f "$ROOT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$ROOT_DIR/.env"; set +a
fi

SURREAL_URL="${SURREAL_URL:-http://localhost:8000}"
SURREAL_USER="${SURREAL_USER:-root}"
SURREAL_PASS="${SURREAL_PASS:-root}"
SURREAL_NS="${SURREAL_NS:-synergine}"
SURREAL_DB="${SURREAL_DB:-main}"
SEED="${1:-}"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

# --- Wait for SurrealDB to be healthy ---
wait_for_surreal() {
  local max_attempts=30
  local attempt=0
  echo -e "${CYAN}Waiting for SurrealDB at ${SURREAL_URL}...${NC}"
  until curl -sf "${SURREAL_URL}/health" > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [[ $attempt -ge $max_attempts ]]; then
      echo -e "${RED}SurrealDB did not become healthy after ${max_attempts} attempts.${NC}"
      exit 1
    fi
    sleep 1
  done
  echo -e "${GREEN}SurrealDB is healthy.${NC}"
}

# --- Execute SurrealQL via HTTP API ---
surreal_query() {
  local sql="$1"
  local response
  response=$(curl -sf \
    -X POST "${SURREAL_URL}/sql" \
    -H "Content-Type: text/plain" \
    -H "Surreal-NS: ${SURREAL_NS}" \
    -H "Surreal-DB: ${SURREAL_DB}" \
    -u "${SURREAL_USER}:${SURREAL_PASS}" \
    --data-raw "$sql")

  # Check for ERR status in response
  if echo "$response" | grep -q '"status":"ERR"'; then
    echo -e "${RED}Schema error:${NC}"
    echo "$response" | grep -o '"result":"[^"]*"' | head -5
    return 1
  fi
  echo "$response"
}

# --- Check if schema already initialized ---
is_initialized() {
  local result
  result=$(curl -sf \
    -X POST "${SURREAL_URL}/sql" \
    -H "Content-Type: text/plain" \
    -H "Surreal-NS: ${SURREAL_NS}" \
    -H "Surreal-DB: ${SURREAL_DB}" \
    -u "${SURREAL_USER}:${SURREAL_PASS}" \
    --data-raw "INFO FOR DB;" 2>/dev/null || echo "")
  echo "$result" | grep -q '"agent"'
}

# --- Apply schema ---
apply_schema() {
  echo -e "${CYAN}Applying SurrealDB schema...${NC}"

  surreal_query "
-- Agents
DEFINE TABLE agent SCHEMAFULL;
DEFINE FIELD name        ON agent TYPE string;
DEFINE FIELD role        ON agent TYPE string;
DEFINE FIELD status      ON agent TYPE string DEFAULT 'idle'
  ASSERT \$value IN ['idle', 'running', 'error', 'stopped'];
DEFINE FIELD model       ON agent TYPE string;
DEFINE FIELD config      ON agent TYPE object DEFAULT {};
DEFINE FIELD created_at  ON agent TYPE datetime DEFAULT time::now();

-- Agent Tasks
DEFINE TABLE agent_task SCHEMAFULL;
DEFINE FIELD agent        ON agent_task TYPE record<agent>;
DEFINE FIELD task_type    ON agent_task TYPE string;
DEFINE FIELD input        ON agent_task TYPE object DEFAULT {};
DEFINE FIELD output       ON agent_task TYPE option<object>;
DEFINE FIELD status       ON agent_task TYPE string DEFAULT 'pending'
  ASSERT \$value IN ['pending', 'running', 'completed', 'failed'];
DEFINE FIELD tokens_used  ON agent_task TYPE int DEFAULT 0;
DEFINE FIELD cost_usd     ON agent_task TYPE float DEFAULT 0.0;
DEFINE FIELD started_at   ON agent_task TYPE datetime DEFAULT time::now();
DEFINE FIELD completed_at ON agent_task TYPE option<datetime>;
DEFINE INDEX agent_task_agent  ON agent_task FIELDS agent;
DEFINE INDEX agent_task_status ON agent_task FIELDS status;

-- Agent Memory (HNSW vector index)
DEFINE TABLE agent_memory SCHEMAFULL;
DEFINE FIELD agent        ON agent_memory TYPE record<agent>;
DEFINE FIELD content      ON agent_memory TYPE string;
DEFINE FIELD memory_type  ON agent_memory TYPE string DEFAULT 'episodic'
  ASSERT \$value IN ['episodic', 'semantic', 'procedural'];
DEFINE FIELD tags         ON agent_memory TYPE array<string> DEFAULT [];
DEFINE FIELD embedding    ON agent_memory TYPE option<array<float>>;
DEFINE FIELD created_at   ON agent_memory TYPE datetime DEFAULT time::now();
DEFINE INDEX agent_memory_agent ON agent_memory FIELDS agent;
DEFINE INDEX agent_memory_hnsw  ON agent_memory FIELDS embedding
  HNSW DIMENSION 768 DIST COSINE;

-- CRM: Company
DEFINE TABLE company SCHEMAFULL;
DEFINE FIELD name       ON company TYPE string;
DEFINE FIELD domain     ON company TYPE option<string>;
DEFINE FIELD industry   ON company TYPE option<string>;
DEFINE FIELD size       ON company TYPE option<string>;
DEFINE FIELD created_at ON company TYPE datetime DEFAULT time::now();
DEFINE INDEX company_domain ON company FIELDS domain UNIQUE;

-- CRM: Contact
DEFINE TABLE contact SCHEMAFULL;
DEFINE FIELD company    ON contact TYPE option<record<company>>;
DEFINE FIELD first_name ON contact TYPE string;
DEFINE FIELD last_name  ON contact TYPE string;
DEFINE FIELD email      ON contact TYPE option<string>;
DEFINE FIELD phone      ON contact TYPE option<string>;
DEFINE FIELD role       ON contact TYPE option<string>;
DEFINE FIELD created_at ON contact TYPE datetime DEFAULT time::now();
DEFINE INDEX contact_email ON contact FIELDS email UNIQUE;

-- CRM: Deal
DEFINE TABLE deal SCHEMAFULL;
DEFINE FIELD company     ON deal TYPE record<company>;
DEFINE FIELD contact     ON deal TYPE option<record<contact>>;
DEFINE FIELD title       ON deal TYPE string;
DEFINE FIELD value_eur   ON deal TYPE float DEFAULT 0.0;
DEFINE FIELD stage       ON deal TYPE string DEFAULT 'lead'
  ASSERT \$value IN ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
DEFINE FIELD probability ON deal TYPE int DEFAULT 0
  ASSERT \$value >= 0 AND \$value <= 100;
DEFINE FIELD created_at  ON deal TYPE datetime DEFAULT time::now();
DEFINE FIELD closed_at   ON deal TYPE option<datetime>;
DEFINE INDEX deal_stage ON deal FIELDS stage;

-- Graph relations
DEFINE TABLE assigned_to SCHEMAFULL TYPE RELATION IN agent OUT agent_task;
DEFINE TABLE remembers   SCHEMAFULL TYPE RELATION IN agent OUT agent_memory;
" > /dev/null

  echo -e "${GREEN}Schema applied.${NC}"
}

# --- Seed demo data ---
seed_data() {
  echo -e "${CYAN}Seeding demo data...${NC}"

  surreal_query "
-- Agents
CREATE agent:orchestrator SET
  name = 'Orchestrator',
  role = 'orchestrator',
  status = 'idle',
  model = 'claude-sonnet-4-6',
  config = { max_parallel_tasks: 10 };

CREATE agent:researcher SET
  name = 'Researcher',
  role = 'researcher',
  status = 'idle',
  model = 'claude-haiku-4-5-20251001',
  config = { search_depth: 3 };

CREATE agent:executor SET
  name = 'Executor',
  role = 'executor',
  status = 'idle',
  model = 'claude-sonnet-4-6',
  config = { timeout_seconds: 300 };

-- Companies
CREATE company:acme SET
  name = 'Acme GmbH',
  domain = 'acme.de',
  industry = 'Software',
  size = '50-200';

CREATE company:techco SET
  name = 'TechCo AG',
  domain = 'techco.de',
  industry = 'Consulting',
  size = '200-500';

-- Contact
CREATE contact:mueller SET
  company = company:acme,
  first_name = 'Hans',
  last_name = 'Mueller',
  email = 'h.mueller@acme.de',
  role = 'CTO';

-- Deal
CREATE deal:deal001 SET
  company = company:acme,
  contact = contact:mueller,
  title = 'AI Agent Platform License',
  value_eur = 24000.0,
  stage = 'proposal',
  probability = 60;
" > /dev/null

  echo -e "${GREEN}Demo data seeded: 3 agents, 2 companies, 1 contact, 1 deal.${NC}"
}

# --- Main ---
wait_for_surreal

if [[ "$SEED" != "--seed" ]] && is_initialized; then
  echo -e "${GREEN}Schema already initialized. Use --seed to add demo data.${NC}"
  exit 0
fi

apply_schema

if [[ "$SEED" == "--seed" ]]; then
  seed_data
fi

echo ""
echo -e "${GREEN}SurrealDB ready.${NC}"
echo "  Namespace: ${SURREAL_NS}"
echo "  Database:  ${SURREAL_DB}"
echo "  URL:       ${SURREAL_URL}"
