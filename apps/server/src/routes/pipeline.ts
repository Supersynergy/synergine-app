import { auth } from "@synergine-app/auth";
import {
	generateApiKey,
	hashApiKey,
	maskApiKey,
} from "@synergine-app/auth/api-keys";
import { db } from "@synergine-app/db";
import {
	apiKey,
	customer,
	leadPipeline,
} from "@synergine-app/db/schema/customer";
import { and, count, eq, gte, isNotNull } from "drizzle-orm";
import { Hono } from "hono";

export const pipelineRouter = new Hono();

// GET /pipeline/stats
pipelineRouter.get("/stats", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const cust = await db
		.select()
		.from(customer)
		.where(eq(customer.userId, session.user.id))
		.limit(1);
	if (!cust[0])
		return c.json({
			totalLeads: 0,
			scoredToday: 0,
			emailsSent: 0,
			replyRate: 0,
			pipelineValue: 0,
		});

	const customerId = cust[0].id;

	// Today midnight UTC
	const todayStart = new Date();
	todayStart.setUTCHours(0, 0, 0, 0);

	const [totalRows, scoredTodayRows, emailsSentRows, repliedRows] =
		await Promise.all([
			db
				.select({ count: count() })
				.from(leadPipeline)
				.where(eq(leadPipeline.customerId, customerId)),
			db
				.select({ count: count() })
				.from(leadPipeline)
				.where(
					and(
						eq(leadPipeline.customerId, customerId),
						eq(leadPipeline.stage, "scored"),
						gte(leadPipeline.createdAt, todayStart),
					),
				),
			db
				.select({ count: count() })
				.from(leadPipeline)
				.where(
					and(
						eq(leadPipeline.customerId, customerId),
						isNotNull(leadPipeline.contactedAt),
					),
				),
			db
				.select({ count: count() })
				.from(leadPipeline)
				.where(
					and(
						eq(leadPipeline.customerId, customerId),
						eq(leadPipeline.stage, "replied"),
					),
				),
		]);

	const totalLeads = totalRows[0]?.count ?? 0;
	const scoredToday = scoredTodayRows[0]?.count ?? 0;
	const emailsSent = emailsSentRows[0]?.count ?? 0;
	const replied = repliedRows[0]?.count ?? 0;
	const replyRate =
		totalLeads > 0 ? Math.round((replied / totalLeads) * 1000) / 10 : 0;
	const pipelineValue = totalLeads * 12;

	return c.json({
		totalLeads,
		scoredToday,
		emailsSent,
		replyRate,
		pipelineValue,
	});
});

// GET /pipeline/stages
pipelineRouter.get("/stages", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const cust = await db
		.select()
		.from(customer)
		.where(eq(customer.userId, session.user.id))
		.limit(1);
	if (!cust[0]) {
		const empty: Record<string, { count: number; leads: unknown[] }> = {};
		for (const s of ["new", "scored", "enriched", "pitched", "replied"]) {
			empty[s] = { count: 0, leads: [] };
		}
		return c.json({ stages: empty });
	}

	const customerId = cust[0].id;
	const allLeads = await db
		.select()
		.from(leadPipeline)
		.where(eq(leadPipeline.customerId, customerId))
		.orderBy(leadPipeline.createdAt);

	const stages: Record<
		string,
		{
			count: number;
			leads: {
				id: string;
				leadId: string;
				score: number | null;
				createdAt: Date;
			}[];
		}
	> = {
		new: { count: 0, leads: [] },
		scored: { count: 0, leads: [] },
		enriched: { count: 0, leads: [] },
		pitched: { count: 0, leads: [] },
		replied: { count: 0, leads: [] },
	};

	for (const lead of allLeads) {
		const s = stages[lead.stage];
		if (s) {
			s.count++;
			if (s.leads.length < 5) {
				s.leads.push({
					id: lead.id,
					leadId: lead.leadId,
					score: lead.score,
					createdAt: lead.createdAt,
				});
			}
		}
	}

	return c.json({ stages });
});

// GET /pipeline/csv
pipelineRouter.get("/csv", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const cust = await db
		.select()
		.from(customer)
		.where(eq(customer.userId, session.user.id))
		.limit(1);
	if (!cust[0]) {
		const date = new Date().toISOString().split("T")[0];
		c.header("Content-Type", "text/csv");
		c.header(
			"Content-Disposition",
			`attachment; filename="leads-export-${date}.csv"`,
		);
		return c.text("id,lead_id,stage,score,contacted_at,created_at\n");
	}

	const customerId = cust[0].id;
	const rows = await db
		.select()
		.from(leadPipeline)
		.where(eq(leadPipeline.customerId, customerId));

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

// GET /pipeline/api-keys
pipelineRouter.get("/api-keys", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	const cust = await db
		.select()
		.from(customer)
		.where(eq(customer.userId, session.user.id))
		.limit(1);
	if (!cust[0]) return c.json([]);

	const keys = await db
		.select()
		.from(apiKey)
		.where(eq(apiKey.customerId, cust[0].id));

	return c.json(
		keys.map((k) => ({
			id: k.id,
			name: k.name,
			maskedKey: maskApiKey(k.keyHash), // mask the hash as proxy (we don't store plain key)
			createdAt: new Date(k.createdAt).toISOString(),
			lastUsed: k.lastUsed ? new Date(k.lastUsed).toISOString() : null,
		})),
	);
});

// POST /pipeline/api-keys/rotate
pipelineRouter.post("/api-keys/rotate", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	let body: { keyId?: unknown };
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { keyId } = body;
	if (typeof keyId !== "string" || !keyId.trim()) {
		return c.json({ error: "keyId is required" }, 400);
	}

	const cust = await db
		.select()
		.from(customer)
		.where(eq(customer.userId, session.user.id))
		.limit(1);
	if (!cust[0]) return c.json({ error: "Customer not found" }, 404);

	// Verify key belongs to this customer
	const existing = await db
		.select()
		.from(apiKey)
		.where(and(eq(apiKey.id, keyId), eq(apiKey.customerId, cust[0].id)))
		.limit(1);
	if (!existing[0]) return c.json({ error: "API key not found" }, 404);

	// Delete old key
	await db.delete(apiKey).where(eq(apiKey.id, keyId));

	// Generate new key
	const plainKey = generateApiKey();
	const keyHash = hashApiKey(plainKey);
	const newId = crypto.randomUUID();

	await db.insert(apiKey).values({
		id: newId,
		customerId: cust[0].id,
		keyHash,
		name: existing[0].name,
	});

	return c.json({ key: plainKey, id: newId });
});
