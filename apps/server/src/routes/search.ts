import { env } from "@synergine-app/env/server";
import { Hono } from "hono";

const searchRouter = new Hono().get("/", async (c) => {
  const q = c.req.query("q");
  if (!q) return c.json({ error: "Missing query param: q" }, 400);

  const index = c.req.query("index") ?? "agents";
  const limit = Number(c.req.query("limit") ?? "20");

  const url = `${env.MEILI_URL}/indexes/${index}/search`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.MEILI_KEY) headers["Authorization"] = `Bearer ${env.MEILI_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ q, limit }),
  });

  if (!res.ok) {
    return c.json({ error: "Search backend error", status: res.status }, 502);
  }

  const data = await res.json();
  return c.json(data);
});

export { searchRouter };
