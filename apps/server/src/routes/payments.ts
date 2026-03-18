import { Hono } from "hono";
import { env } from "@synergine-app/env/server";

const payments = new Hono();

// POST /payments/webhook — Handle Polar webhooks
payments.post("/webhook", async (c) => {
  if (!env.POLAR_ACCESS_TOKEN) {
    return c.json({ error: "Payments not configured" }, 503);
  }

  try {
    const event = await c.req.json();

    // Validate webhook signature if needed
    // For now, just log and acknowledge
    console.log("[Polar Webhook]", event.type, event.data?.id);

    // Handle different event types
    switch (event.type) {
      case "subscription.created":
      case "subscription.updated":
        // Update user subscription in DB
        console.log("Subscription event:", event.data);
        break;
      case "subscription.deleted":
        // Remove or mark subscription as inactive
        console.log("Subscription deleted:", event.data.id);
        break;
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("[Polar Webhook Error]", error);
    return c.json({ error: "Webhook processing failed" }, 400);
  }
});

// POST /payments/checkout — Create Polar checkout session
payments.post("/checkout", async (c) => {
  if (!env.POLAR_ACCESS_TOKEN) {
    return c.json({ error: "Payments not configured" }, 503);
  }

  try {
    const { productId, userId } = await c.req.json();

    if (!productId || !userId) {
      return c.json(
        { error: "Missing productId or userId" },
        400
      );
    }

    // Call Polar API to create checkout
    const response = await fetch("https://api.polar.sh/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: "http://localhost:3001/payments/success",
        cancel_url: "http://localhost:3001/payments/cancel",
        metadata: {
          user_id: userId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Polar API error: ${response.statusText}`);
    }

    const data = await response.json();
    return c.json({ checkoutUrl: data.checkout_url || data.url });
  } catch (error) {
    console.error("[Checkout Error]", error);
    return c.json({ error: "Checkout creation failed" }, 500);
  }
});

// GET /payments/subscription/:userId — Get user subscription info
payments.get("/subscription/:userId", async (c) => {
  if (!env.POLAR_ACCESS_TOKEN) {
    return c.json({ error: "Payments not configured" }, 503);
  }

  try {
    const userId = c.req.param("userId");

    // Fetch from DB or Polar API
    // For now, return placeholder
    return c.json({
      userId,
      status: "active",
      productId: "prod_example",
      // In production: fetch from DB
    });
  } catch (error) {
    console.error("[Subscription Fetch Error]", error);
    return c.json({ error: "Failed to fetch subscription" }, 500);
  }
});

export { payments };
