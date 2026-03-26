import { auth } from "@synergine-app/auth";
import { generateApiKey, hashApiKey } from "@synergine-app/auth/api-keys";
import { db } from "@synergine-app/db";
import { apiKey, customer } from "@synergine-app/db/schema/customer";
import { Hono } from "hono";
import nodemailer from "nodemailer";

const onboarding = new Hono();

// POST /onboarding/activate — Create customer record + API key
onboarding.post("/activate", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	let body: {
		industry?: unknown;
		targets?: unknown;
		smtpConfig?: unknown;
	};
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const { industry, targets, smtpConfig } = body;

	if (
		!Array.isArray(industry) ||
		industry.length === 0 ||
		typeof targets !== "object" ||
		targets === null
	) {
		return c.json({ error: "Missing required fields: industry, targets" }, 400);
	}

	const targetsObj = targets as Record<string, unknown>;
	if (typeof targetsObj.location !== "string" || !targetsObj.location.trim()) {
		return c.json({ error: "targets.location is required" }, 400);
	}

	const customerId = crypto.randomUUID();
	const plainKey = generateApiKey();
	const keyHash = hashApiKey(plainKey);

	try {
		await db.insert(customer).values({
			id: customerId,
			userId: session.user.id,
			industry: JSON.stringify(industry),
			targets: JSON.stringify(targets),
			smtpConfig:
				smtpConfig && typeof smtpConfig === "object"
					? JSON.stringify(smtpConfig)
					: null,
			plan: "starter",
		});

		await db.insert(apiKey).values({
			id: crypto.randomUUID(),
			customerId,
			keyHash,
			name: "default",
		});

		return c.json({ success: true, apiKey: plainKey });
	} catch (err) {
		console.error("[Onboarding/activate]", err);
		return c.json({ error: "Failed to create customer record" }, 500);
	}
});

// POST /onboarding/test-smtp — Verify SMTP connection (always 200)
onboarding.post("/test-smtp", async (c) => {
	let body: {
		host?: unknown;
		port?: unknown;
		username?: unknown;
		password?: unknown;
		fromEmail?: unknown;
	};
	try {
		body = await c.req.json();
	} catch {
		return c.json({ success: false, error: "Invalid JSON body" });
	}

	const { host, port, username, password } = body;

	if (typeof host !== "string" || !host.trim()) {
		return c.json({ success: false, error: "SMTP host is required" });
	}

	try {
		const transporter = nodemailer.createTransport({
			host: String(host),
			port: typeof port === "number" ? port : 587,
			secure: (typeof port === "number" ? port : 587) === 465,
			auth:
				username && password
					? { user: String(username), pass: String(password) }
					: undefined,
		});

		await transporter.verify();
		return c.json({ success: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Connection failed";
		return c.json({ success: false, error: message });
	}
});

export { onboarding };
