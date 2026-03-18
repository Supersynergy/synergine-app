import { auth } from "@synergine-app/auth";
import { env } from "@synergine-app/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { checkHealth } from "@/lib/connections";
import { agentsRouter } from "@/routes/agents";
import { searchRouter } from "@/routes/search";

const app = new Hono();

// --- Global middleware ---
app.use(logger());
app.use(timing());
app.use(secureHeaders());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// --- Auth ---
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// --- Health ---
app.get("/api/health", async (c) => {
  const health = await checkHealth();
  const status = health.status === "ok" ? 200 : 503;
  return c.json({ ...health, uptime: process.uptime(), ts: new Date().toISOString() }, status);
});

// --- API routes ---
const api = app.basePath("/api");
api.route("/agents", agentsRouter);
api.route("/search", searchRouter);

// --- OpenAPI docs (lightweight HTML redirect to Scalar) ---
app.get("/api/docs", (c) =>
  c.html(
    `<!doctype html><html><head><title>Synergine API</title>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script></head>
<body><script>
  Scalar.createApiReference('#app',{url:'/api/openapi.json'})
</script><div id="app"></div></body></html>`,
  ),
);

// --- OpenAPI spec stub ---
app.get("/api/openapi.json", (c) =>
  c.json({
    openapi: "3.1.0",
    info: { title: "Synergine API", version: "0.1.0" },
    paths: {
      "/api/health": { get: { summary: "Health check", tags: ["system"] } },
      "/api/agents": { get: { summary: "List agents", tags: ["agents"] }, post: { summary: "Create agent", tags: ["agents"] } },
      "/api/agents/{id}": { get: { summary: "Get agent", tags: ["agents"] } },
      "/api/agents/{id}/task": { put: { summary: "Assign task", tags: ["agents"] } },
      "/api/search": { get: { summary: "Search via Meilisearch", tags: ["search"] } },
    },
  }),
);

// --- Root ping ---
app.get("/", (c) => c.text("OK"));

export type AppType = typeof app;
export default app;
