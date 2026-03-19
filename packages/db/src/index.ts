import { createClient } from "@libsql/client";
import { env } from "@synergine-app/env/server";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

// --- Drizzle (libSQL / Turso) ---

const client = createClient({
	url: env.DATABASE_URL,
});

export const db = drizzle({ client, schema });

// Re-export schema for convenience
export * from "./schema";

// --- SurrealDB ---

export type {
	Agent,
	AgentMemory,
	AgentTask,
	Company,
	Contact,
	Deal,
	SurrealClientConfig,
	SurrealID,
	SurrealQueryResult,
} from "./surreal-schema";

export {
	createSurrealClient,
	initSurrealSchema,
	SURREAL_SCHEMA,
} from "./surreal-schema";
