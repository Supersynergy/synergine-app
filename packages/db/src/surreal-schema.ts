// =============================================================================
// SurrealDB 3.0.4 Schema — Synergine App
// =============================================================================
// TypeScript types + SurrealQL init queries for agents, CRM, and memory.
// Apply via: ./scripts/init-surreal.sh
// =============================================================================

// --- TypeScript Types ---

export type SurrealID = string; // e.g. "agent:01jqmz..."

export interface Agent {
	id: SurrealID;
	name: string;
	role: string;
	status: "idle" | "running" | "error" | "stopped";
	model: string;
	config: Record<string, unknown>;
	created_at: string; // ISO 8601
}

export interface AgentTask {
	id: SurrealID;
	agent: SurrealID;
	task_type: string;
	input: Record<string, unknown>;
	output: Record<string, unknown> | null;
	status: "pending" | "running" | "completed" | "failed";
	tokens_used: number;
	cost_usd: number;
	started_at: string;
	completed_at: string | null;
}

export interface AgentMemory {
	id: SurrealID;
	agent: SurrealID;
	content: string;
	memory_type: "episodic" | "semantic" | "procedural";
	tags: string[];
	embedding: number[] | null; // 768-dim nomic-embed-text
	created_at: string;
}

export interface Company {
	id: SurrealID;
	name: string;
	domain: string | null;
	industry: string | null;
	size: string | null;
	created_at: string;
}

export interface Contact {
	id: SurrealID;
	company: SurrealID | null;
	first_name: string;
	last_name: string;
	email: string | null;
	phone: string | null;
	role: string | null;
	created_at: string;
}

export interface Deal {
	id: SurrealID;
	company: SurrealID;
	contact: SurrealID | null;
	title: string;
	value_eur: number;
	stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
	probability: number; // 0-100
	created_at: string;
	closed_at: string | null;
}

// --- SurrealQL Schema (applied via HTTP API) ---

export const SURREAL_SCHEMA = /* surql */ `
-- ============================================================
-- Agents
-- ============================================================
DEFINE TABLE agent SCHEMAFULL;
DEFINE FIELD name        ON agent TYPE string;
DEFINE FIELD role        ON agent TYPE string;
DEFINE FIELD status      ON agent TYPE string DEFAULT 'idle'
  ASSERT $value IN ['idle', 'running', 'error', 'stopped'];
DEFINE FIELD model       ON agent TYPE string;
DEFINE FIELD config      ON agent TYPE object DEFAULT {};
DEFINE FIELD created_at  ON agent TYPE datetime DEFAULT time::now();

-- ============================================================
-- Agent Tasks
-- ============================================================
DEFINE TABLE agent_task SCHEMAFULL;
DEFINE FIELD agent       ON agent_task TYPE record<agent>;
DEFINE FIELD task_type   ON agent_task TYPE string;
DEFINE FIELD input       ON agent_task TYPE object DEFAULT {};
DEFINE FIELD output      ON agent_task TYPE option<object>;
DEFINE FIELD status      ON agent_task TYPE string DEFAULT 'pending'
  ASSERT $value IN ['pending', 'running', 'completed', 'failed'];
DEFINE FIELD tokens_used ON agent_task TYPE int DEFAULT 0;
DEFINE FIELD cost_usd    ON agent_task TYPE float DEFAULT 0.0;
DEFINE FIELD started_at  ON agent_task TYPE datetime DEFAULT time::now();
DEFINE FIELD completed_at ON agent_task TYPE option<datetime>;

DEFINE INDEX agent_task_agent ON agent_task FIELDS agent;
DEFINE INDEX agent_task_status ON agent_task FIELDS status;

-- ============================================================
-- Agent Memory (with HNSW vector index for semantic search)
-- ============================================================
DEFINE TABLE agent_memory SCHEMAFULL;
DEFINE FIELD agent        ON agent_memory TYPE record<agent>;
DEFINE FIELD content      ON agent_memory TYPE string;
DEFINE FIELD memory_type  ON agent_memory TYPE string DEFAULT 'episodic'
  ASSERT $value IN ['episodic', 'semantic', 'procedural'];
DEFINE FIELD tags         ON agent_memory TYPE array<string> DEFAULT [];
DEFINE FIELD embedding    ON agent_memory TYPE option<array<float>>;
DEFINE FIELD created_at   ON agent_memory TYPE datetime DEFAULT time::now();

DEFINE INDEX agent_memory_agent ON agent_memory FIELDS agent;
DEFINE INDEX agent_memory_hnsw  ON agent_memory FIELDS embedding
  HNSW DIMENSION 768 DIST COSINE;

-- ============================================================
-- CRM — Company
-- ============================================================
DEFINE TABLE company SCHEMAFULL;
DEFINE FIELD name       ON company TYPE string;
DEFINE FIELD domain     ON company TYPE option<string>;
DEFINE FIELD industry   ON company TYPE option<string>;
DEFINE FIELD size       ON company TYPE option<string>;
DEFINE FIELD created_at ON company TYPE datetime DEFAULT time::now();

DEFINE INDEX company_domain ON company FIELDS domain UNIQUE;

-- ============================================================
-- CRM — Contact
-- ============================================================
DEFINE TABLE contact SCHEMAFULL;
DEFINE FIELD company    ON contact TYPE option<record<company>>;
DEFINE FIELD first_name ON contact TYPE string;
DEFINE FIELD last_name  ON contact TYPE string;
DEFINE FIELD email      ON contact TYPE option<string>;
DEFINE FIELD phone      ON contact TYPE option<string>;
DEFINE FIELD role       ON contact TYPE option<string>;
DEFINE FIELD created_at ON contact TYPE datetime DEFAULT time::now();

DEFINE INDEX contact_email ON contact FIELDS email UNIQUE;

-- ============================================================
-- CRM — Deal
-- ============================================================
DEFINE TABLE deal SCHEMAFULL;
DEFINE FIELD company     ON deal TYPE record<company>;
DEFINE FIELD contact     ON deal TYPE option<record<contact>>;
DEFINE FIELD title       ON deal TYPE string;
DEFINE FIELD value_eur   ON deal TYPE float DEFAULT 0.0;
DEFINE FIELD stage       ON deal TYPE string DEFAULT 'lead'
  ASSERT $value IN ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
DEFINE FIELD probability ON deal TYPE int DEFAULT 0
  ASSERT $value >= 0 AND $value <= 100;
DEFINE FIELD created_at  ON deal TYPE datetime DEFAULT time::now();
DEFINE FIELD closed_at   ON deal TYPE option<datetime>;

DEFINE INDEX deal_stage ON deal FIELDS stage;

-- ============================================================
-- Graph Relations
-- ============================================================
DEFINE TABLE assigned_to  SCHEMAFULL TYPE RELATION IN agent OUT agent_task;
DEFINE TABLE remembers    SCHEMAFULL TYPE RELATION IN agent OUT agent_memory;
`;

// --- Helper: create HTTP API client ---

export interface SurrealClientConfig {
	url: string;
	namespace: string;
	database: string;
	username: string;
	password: string;
}

export interface SurrealQueryResult<T = unknown> {
	status: "OK" | "ERR";
	result: T;
	time: string;
}

export function createSurrealClient(config: SurrealClientConfig) {
	const { url, namespace, database, username, password } = config;
	const auth = Buffer.from(`${username}:${password}`).toString("base64");
	const baseHeaders = {
		"Content-Type": "text/plain",
		Authorization: `Basic ${auth}`,
		"Surreal-NS": namespace,
		"Surreal-DB": database,
	};

	return {
		async query<T = unknown>(sql: string): Promise<SurrealQueryResult<T>[]> {
			const res = await fetch(`${url}/sql`, {
				method: "POST",
				headers: baseHeaders,
				body: sql,
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(`SurrealDB HTTP ${res.status}: ${text}`);
			}
			return res.json() as Promise<SurrealQueryResult<T>[]>;
		},
	};
}

// --- Init function (idempotent — DEFINE IF NOT EXISTS not in v3, schema is idempotent by default) ---

export async function initSurrealSchema(
	config: SurrealClientConfig,
): Promise<void> {
	const client = createSurrealClient(config);
	const results = await client.query(SURREAL_SCHEMA);
	const errors = results.filter((r) => r.status === "ERR");
	if (errors.length > 0) {
		throw new Error(
			`SurrealDB schema init failed:\n${errors.map((e) => JSON.stringify(e.result)).join("\n")}`,
		);
	}
}
