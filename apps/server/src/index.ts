import { auth } from "@synergine-app/auth";
import { env } from "@synergine-app/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { checkHealth } from "@/lib/connections";
import { agentRunsRouter } from "@/routes/agent-runs";
import { agentsRouter } from "@/routes/agents";
import { approvalsRouter } from "@/routes/approvals";
import { billing } from "@/routes/billing";
import { leadsRouter } from "@/routes/leads";
import { newsRouter } from "@/routes/news";
import { onboarding } from "@/routes/onboarding";
import { pipelineRouter } from "@/routes/pipeline";
import { searchRouter } from "@/routes/search";
import { logActivity, system } from "@/routes/system";

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

// --- Request activity logging ---
app.use("*", async (c, next) => {
	const start = Date.now();
	await next();
	const ms = Date.now() - start;
	if (c.req.path.startsWith("/api") && !c.req.path.includes("/system/")) {
		logActivity("api", `${c.req.method} ${c.req.path} → ${c.res.status}`, {
			ms,
		});
	}
});

// --- Auth ---
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// --- Health ---
app.get("/api/health", async (c) => {
	const health = await checkHealth();
	const status = health.status === "ok" ? 200 : 503;
	return c.json(
		{ ...health, uptime: process.uptime(), ts: new Date().toISOString() },
		status,
	);
});

// --- API routes ---
const api = app.basePath("/api");
api.route("/agents", agentsRouter);
api.route("/approvals", approvalsRouter);
api.route("/news", newsRouter);
api.route("/agent-runs", agentRunsRouter);
api.route("/search", searchRouter);
api.route("/system", system);
api.route("/onboarding", onboarding);
api.route("/billing", billing);
api.route("/pipeline", pipelineRouter);
api.route("/leads", leadsRouter);

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
			"/api/agents": {
				get: { summary: "List agents", tags: ["agents"] },
				post: { summary: "Create agent", tags: ["agents"] },
			},
			"/api/agents/{id}": { get: { summary: "Get agent", tags: ["agents"] } },
			"/api/agents/{id}/task": {
				put: { summary: "Assign task", tags: ["agents"] },
			},
			"/api/search": {
				get: { summary: "Search via Meilisearch", tags: ["search"] },
			},
		},
	}),
);

// --- Root ping ---
app.get("/", (c) => c.text("OK"));

export type AppType = typeof app;

// Explicit port binding — reads PORT from .env (default 3001)
const port = env.PORT;
logActivity("system", "Server started", { port });
export default {
	port,
	fetch: app.fetch,
};
