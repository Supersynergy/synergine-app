import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const customer = sqliteTable("customer", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	industry: text("industry").notNull().default("[]"), // JSON array
	targets: text("targets").notNull().default("{}"), // JSON: {location, companySize, keywords}
	smtpConfig: text("smtp_config"), // JSON nullable
	plan: text("plan", { enum: ["starter", "growth", "enterprise"] })
		.notNull()
		.default("starter"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const subscription = sqliteTable("subscription", {
	id: text("id").primaryKey(),
	customerId: text("customer_id")
		.notNull()
		.references(() => customer.id, { onDelete: "cascade" }),
	polarId: text("polar_id").notNull().unique(),
	plan: text("plan").notNull(),
	status: text("status", {
		enum: ["active", "canceled", "past_due"],
	}).notNull(),
	currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const leadPipeline = sqliteTable(
	"lead_pipeline",
	{
		id: text("id").primaryKey(),
		customerId: text("customer_id")
			.notNull()
			.references(() => customer.id, { onDelete: "cascade" }),
		leadId: text("lead_id").notNull(),
		stage: text("stage", {
			enum: ["new", "scored", "enriched", "pitched", "replied"],
		}).notNull(),
		score: integer("score"),
		contactedAt: integer("contacted_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("lead_pipeline_customerId_idx").on(table.customerId)],
);

export const apiKey = sqliteTable(
	"api_key",
	{
		id: text("id").primaryKey(),
		customerId: text("customer_id")
			.notNull()
			.references(() => customer.id, { onDelete: "cascade" }),
		keyHash: text("key_hash").notNull().unique(),
		name: text("name").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		lastUsed: integer("last_used", { mode: "timestamp_ms" }),
	},
	(table) => [index("api_key_customerId_idx").on(table.customerId)],
);

// Relations
export const customerRelations = relations(customer, ({ many }) => ({
	subscriptions: many(subscription),
	leadPipelines: many(leadPipeline),
	apiKeys: many(apiKey),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
	customer: one(customer, {
		fields: [subscription.customerId],
		references: [customer.id],
	}),
}));

export const leadPipelineRelations = relations(leadPipeline, ({ one }) => ({
	customer: one(customer, {
		fields: [leadPipeline.customerId],
		references: [customer.id],
	}),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
	customer: one(customer, {
		fields: [apiKey.customerId],
		references: [customer.id],
	}),
}));
