import { env } from "@synergine-app/env/web";

/**
 * Typed API client for the Synergine server.
 *
 * Wraps fetch with base URL resolution and default headers.
 * Extend with RPC types once the server exports an AppType.
 */
export const api = {
	baseURL: env.VITE_SERVER_URL,

	async get<T = unknown>(path: string, init?: RequestInit): Promise<T> {
		const res = await fetch(`${env.VITE_SERVER_URL}${path}`, {
			...init,
			credentials: "include",
			headers: { "Content-Type": "application/json", ...init?.headers },
		});
		if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
		return res.json() as Promise<T>;
	},

	async post<T = unknown>(
		path: string,
		body?: unknown,
		init?: RequestInit,
	): Promise<T> {
		const res = await fetch(`${env.VITE_SERVER_URL}${path}`, {
			method: "POST",
			...init,
			credentials: "include",
			headers: { "Content-Type": "application/json", ...init?.headers },
			body: body !== undefined ? JSON.stringify(body) : undefined,
		});
		if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
		return res.json() as Promise<T>;
	},
};
