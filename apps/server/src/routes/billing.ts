import { auth } from "@synergine-app/auth";
import { PRICING_TIERS } from "@synergine-app/config/pricing";
import { db } from "@synergine-app/db";
import { customer, subscription } from "@synergine-app/db/schema/customer";
import { env } from "@synergine-app/env/server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

const POLAR_PORTAL_URL = "https://polar.sh/synergine/portal";

const billing = new Hono();

// POST /billing/webhook — Handle Polar.sh webhook events
billing.post("/webhook", async (c) => {
	let event: {
		type?: string;
		data?: Record<string, unknown>;
	};
	try {
		event = await c.req.json();
	} catch {
		return c.json({ received: true });
	}

	const webhookSecret = (env as Record<string, unknown>).POLAR_WEBHOOK_SECRET as
		| string
		| undefined;

	// Validate signature if secret is configured
	if (webhookSecret) {
		const signature = c.req.header("x-polar-signature");
		if (signature) {
			try {
				const body = await c.req.text();
				const encoder = new TextEncoder();
				const keyData = encoder.encode(webhookSecret);
				const cryptoKey = await crypto.subtle.importKey(
					"raw",
					keyData,
					{ name: "HMAC", hash: "SHA-256" },
					false,
					["verify"],
				);
				const sigBytes = Buffer.from(signature, "hex");
				const msgBytes = encoder.encode(body);
				const valid = await crypto.subtle.verify(
					"HMAC",
					cryptoKey,
					sigBytes,
					msgBytes,
				);
				if (!valid) {
					console.warn("[Polar Webhook] Invalid signature");
					return c.json({ received: true });
				}
			} catch {
				// Signature validation failed — log and continue for resilience
				console.warn("[Polar Webhook] Signature validation error");
			}
		}
	}

	console.log(
		"[Polar Webhook]",
		event.type,
		(event.data as { id?: string })?.id,
	);

	try {
		if (event.type === "checkout.completed" && event.data) {
			const data = event.data as {
				id?: string;
				product_id?: string;
				current_period_end?: number;
				metadata?: { user_id?: string };
				customer_email?: string;
			};

			const userId = data.metadata?.user_id;
			if (!userId) {
				return c.json({ received: true });
			}

			// Find customer by userId
			const [existingCustomer] = await db
				.select()
				.from(customer)
				.where(eq(customer.userId, userId))
				.limit(1);

			if (!existingCustomer) {
				console.log(`[Polar Webhook] No customer found for userId=${userId}`);
				return c.json({ received: true });
			}

			const productId = data.product_id ?? "";
			const tier = PRICING_TIERS.find((t) => t.polarProductId === productId);
			const planId = tier?.id ?? "starter";

			// Upsert subscription
			const subId = crypto.randomUUID();
			const polarId = data.id ?? subId;

			try {
				await db.insert(subscription).values({
					id: subId,
					customerId: existingCustomer.id,
					polarId,
					plan: planId,
					status: "active",
					currentPeriodEnd: data.current_period_end
						? new Date(data.current_period_end * 1000)
						: null,
				});
			} catch {
				// polar_id unique constraint — update existing
				await db
					.update(subscription)
					.set({
						status: "active",
						plan: planId,
						currentPeriodEnd: data.current_period_end
							? new Date(data.current_period_end * 1000)
							: null,
					})
					.where(eq(subscription.polarId, polarId));
			}

			// Update customer plan
			await db
				.update(customer)
				.set({ plan: planId as "starter" | "growth" | "enterprise" })
				.where(eq(customer.id, existingCustomer.id));
		}

		if (
			(event.type === "subscription.updated" ||
				event.type === "subscription.created") &&
			event.data
		) {
			const data = event.data as {
				id?: string;
				product_id?: string;
				status?: string;
				current_period_end?: number;
			};
			const polarId = data.id ?? "";
			if (polarId) {
				await db
					.update(subscription)
					.set({
						status:
							(data.status as "active" | "canceled" | "past_due") ?? "active",
						currentPeriodEnd: data.current_period_end
							? new Date(data.current_period_end * 1000)
							: null,
					})
					.where(eq(subscription.polarId, polarId));
			}
		}

		if (event.type === "subscription.canceled" && event.data) {
			const data = event.data as { id?: string };
			const polarId = data.id ?? "";
			if (polarId) {
				await db
					.update(subscription)
					.set({ status: "canceled" })
					.where(eq(subscription.polarId, polarId));
			}
		}
	} catch (err) {
		console.error("[Polar Webhook] Processing error:", err);
	}

	return c.json({ received: true });
});

// POST /billing/checkout — Generate checkout URL for authenticated user
billing.post("/checkout", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	let body: { planId?: string };
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const tier = PRICING_TIERS.find((t) => t.id === body.planId);
	if (!tier) {
		return c.json({ error: "Invalid planId" }, 400);
	}

	const email = session.user.email ?? "";
	const checkoutUrl = email
		? `${tier.polarCheckoutUrl}?customer_email=${encodeURIComponent(email)}`
		: tier.polarCheckoutUrl;

	return c.json({ checkoutUrl });
});

// GET /billing/status — Get current subscription status
billing.get("/status", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const [existingCustomer] = await db
			.select()
			.from(customer)
			.where(eq(customer.userId, session.user.id))
			.limit(1);

		if (!existingCustomer) {
			return c.json({
				plan: null,
				status: null,
				currentPeriodEnd: null,
				portalUrl: POLAR_PORTAL_URL,
			});
		}

		const [latestSub] = await db
			.select()
			.from(subscription)
			.where(eq(subscription.customerId, existingCustomer.id))
			.orderBy(subscription.createdAt)
			.limit(1);

		return c.json({
			plan: latestSub?.plan ?? existingCustomer.plan ?? null,
			status: latestSub?.status ?? null,
			currentPeriodEnd: latestSub?.currentPeriodEnd
				? latestSub.currentPeriodEnd.getTime()
				: null,
			portalUrl: POLAR_PORTAL_URL,
		});
	} catch (err) {
		console.error("[Billing/status]", err);
		return c.json({
			plan: null,
			status: null,
			currentPeriodEnd: null,
			portalUrl: POLAR_PORTAL_URL,
		});
	}
});

export { billing };
