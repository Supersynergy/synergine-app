import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CreditCard,
  Database,
  KeyRound,
  MessageSquare,
  Search,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@synergine-app/ui/components/button";
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
    color: "from-blue-500/20 to-blue-600/5",
    accent: "text-blue-400",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Cache",
    description: "Low-latency key-value store for fast agent coordination.",
    color: "from-yellow-500/20 to-yellow-600/5",
    accent: "text-yellow-400",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Messaging",
    description: "Event-driven queues for reliable agent-to-agent communication.",
    color: "from-purple-500/20 to-purple-600/5",
    accent: "text-purple-400",
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: "Search",
    description: "Full-text and vector search across your agent knowledge base.",
    color: "from-green-500/20 to-green-600/5",
    accent: "text-green-400",
  },
  {
    icon: <KeyRound className="h-5 w-5" />,
    title: "Auth",
    description: "Secure identity and access management for agents and users.",
    color: "from-rose-500/20 to-rose-600/5",
    accent: "text-rose-400",
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: "Payments",
    description: "Monetize your agents with built-in billing and subscription flows.",
    color: "from-emerald-500/20 to-emerald-600/5",
    accent: "text-emerald-400",
  },
];

const STATS = [
  { value: "28", label: "Docker Services" },
  { value: "100+", label: "Use Cases" },
  { value: "$0", label: "per month" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function HomeComponent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-24 pb-20 text-center">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute left-1/4 bottom-0 h-[300px] w-[400px] rounded-full bg-purple-500/8 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            Infrastructure is live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-5xl font-bold sm:text-6xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            AI Agent Infrastructure
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
              for the Modern Web
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto max-w-xl text-lg text-muted-foreground"
            style={{ letterSpacing: "-0.01em" }}
          >
            Orchestrate, coordinate, and scale intelligent agents with batteries-included
            backend services — database, cache, messaging, search, auth, and payments.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.5 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <Link to="/dashboard">
              <Button
                size="lg"
                className="relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_24px_rgba(var(--primary-rgb,99,102,241),0.5)]"
              >
                Get Started
              </Button>
            </Link>
            <Link to="/agents">
              <Button variant="outline" size="lg">
                View Agents
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-muted/20 py-8">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-12 px-4">
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <p className="text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature bento grid */}
      <section className="mx-auto max-w-5xl px-4 py-20 space-y-6">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground"
        >
          Infrastructure Primitives
        </motion.h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon, title, description, color, accent }, i) => (
            <motion.div
              key={title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <Card className="group relative overflow-hidden border-border/60 bg-background/60 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
                <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <CardHeader className="pb-2">
                  <div className={`mb-2 w-fit rounded-lg bg-muted/60 p-2 ${accent}`}>
                    {icon}
                  </div>
                  <CardTitle style={{ letterSpacing: "-0.01em" }}>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-muted/10 px-8 py-12 text-center backdrop-blur space-y-4"
        >
          <h2
            className="text-2xl font-semibold"
            style={{ letterSpacing: "-0.02em" }}
          >
            Ready to deploy?
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Connect your agents, configure your services, and start running
            intelligent workflows in minutes.
          </p>
          <Link to="/dashboard">
            <Button
              size="lg"
              className="mt-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--primary-rgb,99,102,241),0.4)]"
            >
              Open Dashboard
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
