import { Badge } from "@synergine-app/ui/components/badge";
import { Button } from "@synergine-app/ui/components/button";
import { Input } from "@synergine-app/ui/components/input";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/agents")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({ to: "/login", throw: true });
		}
		return { session };
	},
});

const MOCK_AGENTS = [
	{
		id: "agent-1",
		name: "Researcher",
		role: "Research",
		status: "active",
		lastActive: "2 min ago",
	},
	{
		id: "agent-2",
		name: "Coder",
		role: "Engineering",
		status: "active",
		lastActive: "5 min ago",
	},
	{
		id: "agent-3",
		name: "Writer",
		role: "Content",
		status: "idle",
		lastActive: "1 hr ago",
	},
	{
		id: "agent-4",
		name: "Reviewer",
		role: "QA",
		status: "idle",
		lastActive: "3 hr ago",
	},
	{
		id: "agent-5",
		name: "Planner",
		role: "Strategy",
		status: "error",
		lastActive: "1 day ago",
	},
	{
		id: "agent-6",
		name: "Deployer",
		role: "DevOps",
		status: "active",
		lastActive: "12 min ago",
	},
	{
		id: "agent-7",
		name: "Monitor",
		role: "Ops",
		status: "active",
		lastActive: "just now",
	},
	{
		id: "agent-8",
		name: "Analyst",
		role: "Analytics",
		status: "idle",
		lastActive: "2 hr ago",
	},
];

type AgentStatus = "active" | "idle" | "error";
const STATUS_VARIANT: Record<AgentStatus, "success" | "warning" | "error"> = {
	active: "success",
	idle: "warning",
	error: "error",
};

function RouteComponent() {
	const [query, setQuery] = useState("");

	const filtered = MOCK_AGENTS.filter(
		(a) =>
			a.name.toLowerCase().includes(query.toLowerCase()) ||
			a.role.toLowerCase().includes(query.toLowerCase()),
	);

	return (
		<div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl">Agents</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						{MOCK_AGENTS.length} agents configured
					</p>
				</div>
				<Button>
					<Plus className="h-4 w-4" />
					Create Agent
				</Button>
			</div>

			{/* Search */}
			<div className="relative max-w-sm">
				<Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search agents..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="pl-8"
				/>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-none ring-1 ring-foreground/10">
				{/* Header row */}
				<div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-border border-b bg-muted/50 px-4 py-2 font-medium text-muted-foreground text-xs">
					<span>Name</span>
					<span>Role</span>
					<span>Status</span>
					<span>Last Active</span>
				</div>

				{/* Data rows */}
				{filtered.length === 0 ? (
					<div className="px-4 py-8 text-center text-muted-foreground text-sm">
						No agents found
					</div>
				) : (
					filtered.map((agent, i) => (
						<div
							key={agent.id}
							className={`grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/30 ${
								i < filtered.length - 1 ? "border-border/50 border-b" : ""
							}`}
						>
							<span className="font-medium">{agent.name}</span>
							<span className="text-muted-foreground">{agent.role}</span>
							<Badge variant={STATUS_VARIANT[agent.status as AgentStatus]}>
								{agent.status}
							</Badge>
							<span className="text-muted-foreground text-xs">
								{agent.lastActive}
							</span>
						</div>
					))
				)}
			</div>
		</div>
	);
}
