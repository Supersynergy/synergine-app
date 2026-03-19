import { Badge } from "@synergine-app/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@synergine-app/ui/components/card";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Activity, Bot, CheckCircle2, DollarSign, Zap } from "lucide-react";
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

const MOCK_AGENTS = [
	{
		id: "agent-1",
		name: "Researcher",
		role: "Research",
		status: "active",
		tasks: 12,
	},
	{
		id: "agent-2",
		name: "Coder",
		role: "Engineering",
		status: "active",
		tasks: 8,
	},
	{ id: "agent-3", name: "Writer", role: "Content", status: "idle", tasks: 3 },
	{ id: "agent-4", name: "Reviewer", role: "QA", status: "idle", tasks: 5 },
	{
		id: "agent-5",
		name: "Planner",
		role: "Strategy",
		status: "error",
		tasks: 0,
	},
	{
		id: "agent-6",
		name: "Deployer",
		role: "DevOps",
		status: "active",
		tasks: 2,
	},
] as const;

type AgentStatus = "active" | "idle" | "error";

const STATUS_VARIANT: Record<AgentStatus, "success" | "warning" | "error"> = {
	active: "success",
	idle: "warning",
	error: "error",
};

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const activeCount = MOCK_AGENTS.filter((a) => a.status === "active").length;
	const totalTasks = MOCK_AGENTS.reduce((sum, a) => sum + a.tasks, 0);

	return (
		<div className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
			<div>
				<h1 className="font-semibold text-2xl">Dashboard</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Welcome back, {session.data?.user.name ?? "Agent"}
				</p>
			</div>

			{/* Quick stats */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{[
					{
						icon: <Bot className="h-4 w-4 text-primary" />,
						bg: "bg-primary/10",
						label: "Agents Active",
						value: activeCount,
					},
					{
						icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
						bg: "bg-green-500/10",
						label: "Tasks Done",
						value: totalTasks,
					},
					{
						icon: <Zap className="h-4 w-4 text-blue-600" />,
						bg: "bg-blue-500/10",
						label: "Throughput",
						value: "98%",
					},
					{
						icon: <DollarSign className="h-4 w-4 text-orange-600" />,
						bg: "bg-orange-500/10",
						label: "Cost Today",
						value: "$0.42",
					},
				].map(({ icon, bg, label, value }) => (
					<Card key={label}>
						<CardContent className="pt-4">
							<div className="flex items-center gap-3">
								<div className={`rounded-md ${bg} p-2`}>{icon}</div>
								<div>
									<p className="text-muted-foreground text-xs">{label}</p>
									<p className="font-bold text-2xl">{value}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* System health */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2">
						<Activity className="h-4 w-4" />
						System Health
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
						<span className="text-sm">All systems operational</span>
						<span className="ml-auto text-muted-foreground text-xs">
							Last check: just now
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Agent status cards */}
			<div>
				<h2 className="mb-3 font-medium text-muted-foreground text-sm">
					Agents
				</h2>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{MOCK_AGENTS.map((agent) => (
						<Card key={agent.id}>
							<CardContent className="pt-4">
								<div className="flex items-start justify-between">
									<div>
										<p className="font-medium text-sm">{agent.name}</p>
										<p className="text-muted-foreground text-xs">
											{agent.role}
										</p>
									</div>
									<Badge variant={STATUS_VARIANT[agent.status as AgentStatus]}>
										{agent.status}
									</Badge>
								</div>
								<p className="mt-3 text-muted-foreground text-xs">
									{agent.tasks} tasks completed
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
