import { Hono } from "hono";
import { z } from "zod";

const CreateAgentSchema = z.object({
	name: z.string().min(1).max(100),
	role: z.string().min(1),
	model: z.string().default("claude-haiku-4-5-20251001"),
	config: z.record(z.unknown()).optional(),
});

const AssignTaskSchema = z.object({
	task: z.string().min(1),
	priority: z.enum(["low", "normal", "high"]).default("normal"),
});

// In-memory store — replace with SurrealDB when ready
const agents: Record<
	string,
	{
		id: string;
		name: string;
		role: string;
		model: string;
		config?: Record<string, unknown>;
		createdAt: string;
	}
> = {};

const agentsRouter = new Hono()

	.get("/", (c) => {
		return c.json({ agents: Object.values(agents) });
	})

	.post("/", async (c) => {
		const body = await c.req.json();
		const parsed = CreateAgentSchema.safeParse(body);
		if (!parsed.success) {
			return c.json(
				{ error: "Invalid input", issues: parsed.error.issues },
				400,
			);
		}

		const id = crypto.randomUUID();
		const agent = { id, ...parsed.data, createdAt: new Date().toISOString() };
		agents[id] = agent;
		return c.json({ agent }, 201);
	})

	.get("/:id", (c) => {
		const agent = agents[c.req.param("id")];
		if (!agent) return c.json({ error: "Agent not found" }, 404);
		return c.json({ agent });
	})

	.put("/:id/task", async (c) => {
		const agent = agents[c.req.param("id")];
		if (!agent) return c.json({ error: "Agent not found" }, 404);

		const body = await c.req.json();
		const parsed = AssignTaskSchema.safeParse(body);
		if (!parsed.success) {
			return c.json(
				{ error: "Invalid input", issues: parsed.error.issues },
				400,
			);
		}

		// Task queuing placeholder — wire to NATS when ready
		return c.json({
			queued: true,
			agentId: agent.id,
			task: parsed.data.task,
			priority: parsed.data.priority,
		});
	});

export { agentsRouter };
