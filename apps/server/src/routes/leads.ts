import { hashApiKey } from "@synergine-app/auth/api-keys";
import { PRICING_TIERS } from "@synergine-app/config/pricing";
import { db } from "@synergine-app/db";
import {
	apiKey,
	customer,
	leadPipeline,
} from "@synergine-app/db/schema/customer";
import { and, count, eq, gte } from "drizzle-orm";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";

export const leadsRouter = new Hono<{
	Variables: {
		customerId: string;
		plan: "starter" | "growth" | "enterprise";
	};
}>();

// ---------- Rate Limit Store ----------
const rateLimitStore = new Map<
	string,
	{ count: number; windowStart: number }
>();

function checkRateLimit(
	customerId: string,
	limitPerMin: number,
): { allowed: boolean; remaining: number; retryAfter: number } {
	const now = Date.now();
	const windowMs = 60_000;
	const entry = rateLimitStore.get(customerId);
	if (!entry || now - entry.windowStart > windowMs) {
		rateLimitStore.set(customerId, { count: 1, windowStart: now });
		return { allowed: true, remaining: limitPerMin - 1, retryAfter: 0 };
	}
	if (entry.count >= limitPerMin) {
		const retryAfter = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
		return { allowed: false, remaining: 0, retryAfter };
	}
	entry.count++;
	return { allowed: true, remaining: limitPerMin - entry.count, retryAfter: 0 };
}

// ---------- API Key Middleware ----------
const apiKeyMiddleware = createMiddleware<{
	Variables: {
		customerId: string;
		plan: "starter" | "growth" | "enterprise";
	};
}>(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ error: "Missing or malformed Authorization header" }, 401);
	}

	const rawKey = authHeader.slice(7);
	if (!rawKey.trim()) {
		return c.json({ error: "Missing or malformed Authorization header" }, 401);
	}

	const keyHash = hashApiKey(rawKey);

	const keyRows = await db
		.select()
		.from(apiKey)
		.where(eq(apiKey.keyHash, keyHash))
		.limit(1);

	if (!keyRows[0]) {
		return c.json({ error: "Invalid API key" }, 401);
	}

	const custRows = await db
		.select()
		.from(customer)
		.where(eq(customer.id, keyRows[0].customerId))
		.limit(1);

	if (!custRows[0]) {
		return c.json({ error: "Invalid API key" }, 401);
	}

	const cust = custRows[0];
	const tier = PRICING_TIERS.find((t) => t.id === cust.plan);
	const limitPerMin = tier?.limits.apiRequestsPerMin ?? 100;

	const rl = checkRateLimit(cust.id, limitPerMin);
	if (!rl.allowed) {
		c.header("Retry-After", String(rl.retryAfter));
		c.header("X-RateLimit-Remaining", "0");
		return c.json(
			{ error: "Rate limit exceeded", retryAfter: rl.retryAfter },
			429,
		);
	}

	// Fire-and-forget: update lastUsed
	db.update(apiKey)
		.set({ lastUsed: new Date() })
		.where(eq(apiKey.id, keyRows[0].id))
		.catch(() => {});

	c.set("customerId", cust.id);
	c.set("plan", cust.plan);

	await next();
});

leadsRouter.use("/*", apiKeyMiddleware);

// GET /leads
leadsRouter.get("/", async (c) => {
	const customerId = c.get("customerId");

	const minScore = c.req.query("min_score")
		? Number(c.req.query("min_score"))
		: undefined;
	const limit = Math.min(Number(c.req.query("limit") ?? "100"), 1000);
	const offset = Number(c.req.query("offset") ?? "0");

	// Build where conditions
	const conditions = [eq(leadPipeline.customerId, customerId)];
	if (minScore !== undefined && !Number.isNaN(minScore)) {
		conditions.push(gte(leadPipeline.score, minScore));
	}

	const [totalRows, dataRows] = await Promise.all([
		db
			.select({ count: count() })
			.from(leadPipeline)
			.where(and(...conditions)),
		db
			.select()
			.from(leadPipeline)
			.where(and(...conditions))
			.limit(limit)
			.offset(offset),
	]);

	const total = totalRows[0]?.count ?? 0;
	c.header("X-Total-Count", String(total));

	return c.json({
		leads: dataRows.map((r) => ({
			id: r.id,
			leadId: r.leadId,
			stage: r.stage,
			score: r.score,
			contactedAt: r.contactedAt ? new Date(r.contactedAt).toISOString() : null,
			createdAt: new Date(r.createdAt).toISOString(),
		})),
		total,
	});
});

// GET /leads/:id/score
leadsRouter.get("/:id/score", async (c) => {
	const customerId = c.get("customerId");
	const id = c.req.param("id");

	const rows = await db
		.select()
		.from(leadPipeline)
		.where(
			and(eq(leadPipeline.id, id), eq(leadPipeline.customerId, customerId)),
		)
		.limit(1);

	if (!rows[0]) {
		return c.json({ error: "Lead not found" }, 404);
	}

	const r = rows[0];
	return c.json({
		leadId: r.leadId,
		score: r.score,
		stage: r.stage,
		factors: {
			stageProgress: [
				"new",
				"scored",
				"enriched",
				"pitched",
				"replied",
			].indexOf(r.stage),
			hasScore: r.score !== null,
			wasContacted: r.contactedAt !== null,
		},
		confidence: "medium",
	});
});

// POST /leads/export
leadsRouter.post("/export", async (c) => {
	const customerId = c.get("customerId");

	let body: {
		min_score?: unknown;
		limit?: unknown;
	} = {};
	try {
		body = await c.req.json();
	} catch {
		// empty body is ok
	}

	const minScore =
		typeof body.min_score === "number" ? body.min_score : undefined;
	const limit = Math.min(
		typeof body.limit === "number" ? body.limit : 1000,
		1000,
	);

	const conditions = [eq(leadPipeline.customerId, customerId)];
	if (minScore !== undefined) {
		conditions.push(gte(leadPipeline.score, minScore));
	}

	const rows = await db
		.select()
		.from(leadPipeline)
		.where(and(...conditions))
		.limit(limit);

	const lines = ["id,lead_id,stage,score,contacted_at,created_at"];
	for (const r of rows) {
		lines.push(
			[
				r.id,
				r.leadId,
				r.stage,
				r.score ?? "",
				r.contactedAt ? new Date(r.contactedAt).toISOString() : "",
				new Date(r.createdAt).toISOString(),
			].join(","),
		);
	}

	const date = new Date().toISOString().split("T")[0];
	c.header("Content-Type", "text/csv");
	c.header(
		"Content-Disposition",
		`attachment; filename="leads-export-${date}.csv"`,
	);
	return c.text(lines.join("\n"));
});
