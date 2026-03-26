import { createHash, randomBytes } from "node:crypto";

export function generateApiKey(): string {
	const bytes = randomBytes(32);
	return `sk_live_${bytes.toString("base64url")}`;
}

export function hashApiKey(key: string): string {
	return createHash("sha256").update(key).digest("hex");
}

export function maskApiKey(key: string): string {
	return `${key.slice(0, 12)}...${key.slice(-4)}`;
}
