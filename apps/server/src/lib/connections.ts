import { env } from "@synergine-app/env/server";
import Redis from "ioredis";
import { connect as natsConnect, type NatsConnection } from "nats";
import Surreal from "surrealdb";

// --- SurrealDB ---

let surrealClient: Surreal | null = null;

export async function getSurrealDB(): Promise<Surreal> {
  if (surrealClient) return surrealClient;
  const db = new Surreal();
  await db.connect(env.SURREAL_URL);
  await db.signin({ username: env.SURREAL_USER, password: env.SURREAL_PASS });
  await db.use({ namespace: env.SURREAL_NS, database: env.SURREAL_DB });
  surrealClient = db;
  return db;
}

// --- Dragonfly (ioredis) ---

let dragonflyClient: Redis | null = null;

export function getDragonfly(): Redis {
  if (dragonflyClient) return dragonflyClient;
  dragonflyClient = new Redis(env.DRAGONFLY_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  return dragonflyClient;
}

// --- NATS ---

let natsClient: NatsConnection | null = null;

export async function getNats(): Promise<NatsConnection> {
  if (natsClient) return natsClient;
  natsClient = await natsConnect({ servers: env.NATS_URL });
  return natsClient;
}

// --- Health check ---

export type ServiceStatus = "ok" | "error";

export interface HealthStatus {
  status: "ok" | "degraded";
  services: {
    surrealdb: ServiceStatus;
    dragonfly: ServiceStatus;
    nats: ServiceStatus;
  };
}

export async function checkHealth(): Promise<HealthStatus> {
  const results = await Promise.allSettled([
    getSurrealDB().then((db) => db.ping()),
    getDragonfly().ping(),
    getNats().then((nc) => nc.stats()),
  ]);

  const [surreal, dragonfly, nats] = results.map(
    (r): ServiceStatus => (r.status === "fulfilled" ? "ok" : "error"),
  );

  const allOk = surreal === "ok" && dragonfly === "ok" && nats === "ok";

  return {
    status: allOk ? "ok" : "degraded",
    services: { surrealdb: surreal, dragonfly, nats },
  };
}
