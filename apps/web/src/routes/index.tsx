import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, KeyRound, MessageSquare, Search, Zap } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@synergine-app/ui/components/card";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const FEATURES = [
  {
    icon: <Database className="h-5 w-5" />,
    title: "Database",
    description: "Persistent storage for agent state, memory, and structured data.",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Cache",
    description: "Low-latency key-value store for fast agent coordination.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Messaging",
    description: "Event-driven queues for reliable agent-to-agent communication.",
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: "Search",
    description: "Full-text and vector search across your agent knowledge base.",
  },
  {
    icon: <KeyRound className="h-5 w-5" />,
    title: "Auth",
    description: "Secure identity and access management for agents and users.",
  },
];

function HomeComponent() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-none border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Infrastructure is live
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Synergine
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          AI Agent Infrastructure. Orchestrate, coordinate, and scale intelligent
          agents with batteries-included backend services.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Open Dashboard
          </Link>
          <Link
            to="/agents"
            className="inline-flex h-9 items-center gap-1.5 border border-border bg-background px-4 text-xs font-medium transition-colors hover:bg-muted"
          >
            View Agents
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="space-y-4">
        <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Infrastructure Primitives
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon, title, description }) => (
            <Card key={title}>
              <CardHeader className="pb-2">
                <div className="mb-1 w-fit rounded-md bg-primary/10 p-2 text-primary">
                  {icon}
                </div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="rounded-none border border-border bg-muted/20 px-6 py-10 text-center space-y-4">
        <h2 className="text-xl font-semibold">Ready to deploy?</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Connect your agents, configure your services, and start running
          intelligent workflows in minutes.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex h-8 items-center gap-1.5 bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Get Started
        </Link>
      </section>
    </div>
  );
}
