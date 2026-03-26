import { Badge } from "@synergine-app/ui/components/badge";
import { Button } from "@synergine-app/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@synergine-app/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@synergine-app/ui/components/dialog";
import { Skeleton } from "@synergine-app/ui/components/skeleton";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({ to: "/login", throw: true });
		}
		return { session };
	},
});

const API = "http://localhost:3001/api";

type Health = {
	status: string;
	services: Record<string, string>;
	uptime: number;
	memory: { rss: number; heap: number; heapTotal: number };
	ts: string;
};

type Activity = {
	ts: string;
	type: string;
	message: string;
	meta?: Record<string, unknown>;
};

type SystemInfo = {
	version: string;
	runtime: string;
	platform: string;
	env: string;
	startedAt: string;
};

type BillingStatus = {
	plan: string | null;
	status: string | null;
	currentPeriodEnd: number | null;
	portalUrl: string;
};

type PipelineStats = {
	totalLeads: number;
	scoredToday: number;
	emailsSent: number;
	replyRate: number;
	pipelineValue: number;
};

type PipelineLead = {
	id: string;
	leadId: string;
	score: number | null;
	createdAt: string;
};

type PipelineStages = {
	stages: Record<string, { count: number; leads: PipelineLead[] }>;
};

type ApiKeyInfo = {
	id: string;
	name: string;
	maskedKey: string;
	createdAt: string;
	lastUsed: string | null;
};

function formatUptime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return `${h}h ${m}m ${s}s`;
}

function ServiceCard({ name, status }: { name: string; status: string }) {
	const isOk = status === "ok";
	return (
		<Card className="border-border">
			<CardContent className="flex items-center justify-between p-4">
				<div className="flex items-center gap-3">
					<div
						className={`h-3 w-3 rounded-full ${isOk ? "animate-pulse bg-emerald-500" : "bg-red-500"}`}
					/>
					<span className="font-medium capitalize">{name}</span>
				</div>
				<Badge variant={isOk ? "default" : "destructive"} className="text-xs">
					{status}
				</Badge>
			</CardContent>
		</Card>
	);
}

const STAGE_LABELS: Record<string, string> = {
	new: "New",
	scored: "Scored",
	enriched: "Enriched",
	pitched: "Pitched",
	replied: "Replied",
};

function scoreBadgeClass(score: number | null): string {
	if (score === null) return "bg-muted text-muted-foreground";
	if (score >= 70)
		return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
	if (score >= 40)
		return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
	return "bg-muted text-muted-foreground";
}

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const [health, setHealth] = useState<Health | null>(null);
	const [activity, setActivity] = useState<Activity[]>([]);
	const [info, setInfo] = useState<SystemInfo | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(
		null,
	);
	const [billingLoading, setBillingLoading] = useState(true);

	// Pipeline state
	const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(
		null,
	);
	const [pipelineStages, setPipelineStages] = useState<PipelineStages | null>(
		null,
	);
	const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
	const [rotatedKey, setRotatedKey] = useState<string | null>(null);

	const fetchPipelineStats = async () => {
		try {
			const res = await fetch(`${API}/pipeline/stats`, {
				credentials: "include",
			});
			if (res.ok) {
				const data: PipelineStats = await res.json();
				setPipelineStats(data);
			}
		} catch {
			// silently ignore pipeline stat errors
		}
	};

	const fetchAll = async () => {
		try {
			const [h, a, i] = await Promise.allSettled([
				fetch(`${API}/system/health`).then((r) => r.json()),
				fetch(`${API}/system/activity?limit=20`).then((r) => r.json()),
				fetch(`${API}/system/info`).then((r) => r.json()),
			]);
			if (h.status === "fulfilled") setHealth(h.value);
			if (a.status === "fulfilled") setActivity(a.value);
			if (i.status === "fulfilled") setInfo(i.value);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Connection failed");
		}
	};

	useEffect(() => {
		fetchAll();
		const interval = setInterval(fetchAll, 5000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		fetch(`${API}/billing/status`, { credentials: "include" })
			.then((r) => r.json())
			.then((data: BillingStatus) => setBillingStatus(data))
			.catch(() => setBillingStatus(null))
			.finally(() => setBillingLoading(false));
	}, []);

	// Load pipeline data on mount + poll stats every 30s
	useEffect(() => {
		const loadInitialPipeline = async () => {
			const [stagesRes, keysRes] = await Promise.allSettled([
				fetch(`${API}/pipeline/stages`, { credentials: "include" }).then((r) =>
					r.ok ? r.json() : null,
				),
				fetch(`${API}/pipeline/api-keys`, { credentials: "include" }).then(
					(r) => (r.ok ? r.json() : null),
				),
			]);
			if (stagesRes.status === "fulfilled" && stagesRes.value) {
				setPipelineStages(stagesRes.value);
			}
			if (keysRes.status === "fulfilled" && keysRes.value) {
				setApiKeys(keysRes.value);
			}
		};

		fetchPipelineStats();
		loadInitialPipeline();

		const statsInterval = setInterval(fetchPipelineStats, 30_000);
		return () => clearInterval(statsInterval);
	}, []);

	const handleRotateKey = async (keyId: string) => {
		try {
			const res = await fetch(`${API}/pipeline/api-keys/rotate`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ keyId }),
			});
			if (res.ok) {
				const data: { key: string; id: string } = await res.json();
				setRotatedKey(data.key);
				// Refresh key list
				const keysRes = await fetch(`${API}/pipeline/api-keys`, {
					credentials: "include",
				});
				if (keysRes.ok) {
					setApiKeys(await keysRes.json());
				}
			}
		} catch {
			// silently ignore
		}
	};

	const STAGES = ["new", "scored", "enriched", "pitched", "replied"];

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">System Dashboard</h1>
					<p className="text-muted-foreground text-sm">
						Welcome back, {session.data?.user.name ?? "Agent"} · Live
						infrastructure monitoring
						{health && (
							<span className="ml-2">
								· Uptime: {formatUptime(health.uptime)}
							</span>
						)}
					</p>
				</div>
				<Badge
					variant={health?.status === "ok" ? "default" : "destructive"}
					className="px-3 py-1 text-sm"
				>
					{health?.status === "ok"
						? "All Systems Operational"
						: health
							? "Degraded"
							: "Connecting..."}
				</Badge>
			</div>

			{/* Connection error */}
			{error && (
				<Card className="border-red-500/50 bg-red-500/5">
					<CardContent className="p-4 text-red-400 text-sm">
						Connection error: {error}. Retrying...
					</CardContent>
				</Card>
			)}

			{/* ── Stats Bar ── */}
			<div>
				<h2 className="mb-3 font-medium text-muted-foreground text-sm">
					Lead Pipeline
				</h2>
				<div className="grid grid-cols-5 gap-4">
					{pipelineStats ? (
						<>
							<Card>
								<CardContent className="p-4 text-center">
									<p className="font-bold text-2xl">
										{pipelineStats.totalLeads}
									</p>
									<p className="text-muted-foreground text-xs">Total Leads</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-4 text-center">
									<p className="font-bold text-2xl">
										{pipelineStats.scoredToday}
									</p>
									<p className="text-muted-foreground text-xs">Scored Today</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-4 text-center">
									<p className="font-bold text-2xl">
										{pipelineStats.emailsSent}
									</p>
									<p className="text-muted-foreground text-xs">Emails Sent</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-4 text-center">
									<p className="font-bold text-2xl">
										{pipelineStats.replyRate}%
									</p>
									<p className="text-muted-foreground text-xs">Reply Rate</p>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-4 text-center">
									<p className="font-bold text-2xl">
										€{pipelineStats.pipelineValue}
									</p>
									<p className="text-muted-foreground text-xs">
										Pipeline Value
									</p>
								</CardContent>
							</Card>
						</>
					) : (
						Array.from({ length: 5 }).map((_, i) => (
							<Card key={i}>
								<CardContent className="p-4">
									<Skeleton className="mb-2 h-8 w-16" />
									<Skeleton className="h-3 w-20" />
								</CardContent>
							</Card>
						))
					)}
				</div>
			</div>

			{/* ── Pipeline Kanban ── */}
			<div>
				<div className="mb-3 flex items-center justify-between">
					<h2 className="font-medium text-muted-foreground text-sm">
						Pipeline Stages
					</h2>
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.open(`${API}/pipeline/csv`, "_blank")}
					>
						Download CSV
					</Button>
				</div>
				<div className="grid grid-cols-5 gap-3">
					{pipelineStages
						? STAGES.map((stage) => {
								const stageData = pipelineStages.stages[stage] ?? {
									count: 0,
									leads: [],
								};
								return (
									<Card key={stage} className="flex flex-col">
										<CardHeader className="flex-row items-center justify-between space-y-0 px-3 pt-3 pb-2">
											<CardTitle className="font-medium text-sm capitalize">
												{STAGE_LABELS[stage] ?? stage}
											</CardTitle>
											<Badge variant="outline" className="text-xs">
												{stageData.count}
											</Badge>
										</CardHeader>
										<CardContent className="flex-1 space-y-1.5 px-3 pb-3">
											{stageData.leads.length === 0 ? (
												<p className="text-muted-foreground text-xs">
													No leads
												</p>
											) : (
												stageData.leads.map((lead) => (
													<div
														key={lead.id}
														className="flex items-center justify-between rounded border border-border/50 px-2 py-1 text-xs"
													>
														<span className="max-w-[70px] truncate font-mono text-[10px]">
															{lead.leadId.slice(0, 12)}
														</span>
														{lead.score !== null && (
															<Badge
																variant="outline"
																className={`shrink-0 px-1 py-0 text-[9px] ${scoreBadgeClass(lead.score)}`}
															>
																{lead.score}
															</Badge>
														)}
													</div>
												))
											)}
										</CardContent>
									</Card>
								);
							})
						: Array.from({ length: 5 }).map((_, i) => (
								<Card key={i}>
									<CardContent className="space-y-2 p-3">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-3 w-3/4" />
									</CardContent>
								</Card>
							))}
				</div>
			</div>

			{/* ── API Key Management ── */}
			<div>
				<h2 className="mb-3 font-medium text-muted-foreground text-sm">
					API Access
				</h2>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="font-semibold text-sm">API Keys</CardTitle>
					</CardHeader>
					<CardContent>
						{apiKeys.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No API keys found. Complete onboarding to generate your API key.
							</p>
						) : (
							<div className="space-y-3">
								{apiKeys.map((k) => (
									<div
										key={k.id}
										className="flex items-center justify-between rounded border border-border/50 p-3"
									>
										<div className="space-y-0.5">
											<p className="font-medium text-sm">{k.name}</p>
											<p className="font-mono text-muted-foreground text-xs">
												{k.maskedKey}
											</p>
											<p className="text-[10px] text-muted-foreground">
												Last used:{" "}
												{k.lastUsed
													? new Date(k.lastUsed).toLocaleDateString()
													: "Never"}
											</p>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleRotateKey(k.id)}
										>
											Rotate
										</Button>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Dialog: show rotated key once */}
			<Dialog
				open={rotatedKey !== null}
				onOpenChange={(open) => {
					if (!open) setRotatedKey(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New API Key Generated</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3">
							<p className="font-medium text-sm text-yellow-400">
								Save this key now — it will not be shown again
							</p>
						</div>
						<div className="rounded bg-muted p-3">
							<p className="break-all font-mono text-sm">{rotatedKey}</p>
						</div>
						<Button
							className="w-full"
							onClick={() => {
								if (rotatedKey) {
									navigator.clipboard.writeText(rotatedKey);
								}
							}}
						>
							Copy to Clipboard
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Service Status */}
			<div>
				<h2 className="mb-3 font-medium text-muted-foreground text-sm">
					Services
				</h2>
				<div className="grid grid-cols-3 gap-4">
					{health ? (
						Object.entries(health.services).map(([name, status]) => (
							<ServiceCard key={name} name={name} status={status} />
						))
					) : (
						<p className="col-span-3 text-muted-foreground text-sm">
							Loading service status...
						</p>
					)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-6">
				{/* System Info + Memory */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="font-semibold text-sm">System Info</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						{info && (
							<>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Runtime</span>
									<span>{info.runtime}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Platform</span>
									<span>{info.platform}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Environment</span>
									<Badge variant="outline" className="text-[10px]">
										{info.env}
									</Badge>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Version</span>
									<span>{info.version}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Started</span>
									<span className="text-xs">
										{new Date(info.startedAt).toLocaleString()}
									</span>
								</div>
							</>
						)}
						{health?.memory && (
							<>
								<div className="my-2 border-t" />
								<div className="flex justify-between">
									<span className="text-muted-foreground">Memory (RSS)</span>
									<span>{health.memory.rss} MB</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Heap Used</span>
									<span>
										{health.memory.heap} / {health.memory.heapTotal} MB
									</span>
								</div>
								<div className="mt-1 h-2 w-full rounded-full bg-muted">
									<div
										className="h-2 rounded-full bg-primary transition-all"
										style={{
											width: `${Math.min((health.memory.heap / health.memory.heapTotal) * 100, 100)}%`,
										}}
									/>
								</div>
							</>
						)}
						{!info && !health && (
							<p className="text-muted-foreground">Loading...</p>
						)}
					</CardContent>
				</Card>

				{/* Activity Log */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 font-semibold text-sm">
							Activity Log
							<span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="max-h-[300px] space-y-1.5 overflow-y-auto">
							{activity.length === 0 ? (
								<p className="py-4 text-center text-muted-foreground text-sm">
									No activity yet
								</p>
							) : (
								activity.map((a, i) => (
									<div
										key={`${a.ts}-${i}`}
										className="flex items-start gap-2 border-border/50 border-b py-1 text-xs last:border-0"
									>
										<span className="whitespace-nowrap text-muted-foreground tabular-nums">
											{new Date(a.ts).toLocaleTimeString()}
										</span>
										<Badge variant="outline" className="shrink-0 text-[10px]">
											{a.type}
										</Badge>
										<span className="text-foreground">{a.message}</span>
									</div>
								))
							)}
						</div>
					</CardContent>
				</Card>
			</div>
			{/* Billing Status */}
			<div>
				<h2 className="mb-3 font-medium text-muted-foreground text-sm">
					Billing
				</h2>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="font-semibold text-sm">
							Subscription
						</CardTitle>
					</CardHeader>
					<CardContent>
						{billingLoading ? (
							<Skeleton className="h-20 w-full" />
						) : billingStatus?.plan ? (
							<div className="space-y-3 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Plan</span>
									<Badge className="capitalize">{billingStatus.plan}</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Status</span>
									<Badge
										variant={
											billingStatus.status === "active"
												? "default"
												: billingStatus.status === "past_due"
													? "outline"
													: "destructive"
										}
										className={
											billingStatus.status === "active"
												? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
												: billingStatus.status === "past_due"
													? "border-yellow-500/30 text-yellow-400"
													: ""
										}
									>
										{billingStatus.status ?? "unknown"}
									</Badge>
								</div>
								{billingStatus.currentPeriodEnd && (
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											Next billing date
										</span>
										<span>
											{new Date(
												billingStatus.currentPeriodEnd,
											).toLocaleDateString()}
										</span>
									</div>
								)}
								<div className="pt-1">
									<a
										href={billingStatus.portalUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary text-sm hover:underline"
									>
										Manage Billing →
									</a>
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									No active subscription
								</p>
								<Button size="sm" variant="outline" asChild>
									<Link to="/pricing">View Plans</Link>
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
