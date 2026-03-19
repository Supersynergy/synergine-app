import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		SURREAL_URL: z.string().url().default("http://127.0.0.1:8000"),
		SURREAL_NS: z.string().default("synergine"),
		SURREAL_DB: z.string().default("main"),
		SURREAL_USER: z.string().default("root"),
		SURREAL_PASS: z.string().default("root"),
		DRAGONFLY_URL: z.string().default("redis://127.0.0.1:6379"),
		NATS_URL: z.string().default("nats://127.0.0.1:4222"),
		MEILI_URL: z.string().url().default("http://127.0.0.1:7700"),
		MEILI_KEY: z.string().default(""),
		POLAR_ACCESS_TOKEN: z.string().optional(),
		RESEND_API_KEY: z.string().optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
