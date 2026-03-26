import { Button } from "@synergine-app/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@synergine-app/ui/components/card";
import { PRICING_TIERS } from "@synergine-app/config";
import { createFileRoute } from "@tanstack/react-router";
import {
	BarChart3,
	Bell,
	Bot,
	Check,
	Mail,
	Plug,
	Target,
} from "lucide-react";
import { motion } from "motion/react";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

const FEATURES = [
	{
		icon: <Target className="h-5 w-5" />,
		title: "Lead Scoring",
		description:
			"AI scores every lead 0-100 based on fit, intent signals, and company data.",
		color: "from-blue-500/20 to-blue-600/5",
		accent: "text-blue-400",
	},
	{
		icon: <Mail className="h-5 w-5" />,
		title: "Email Enrichment",
		description:
			"Verified business emails found for 98% of leads via multi-source validation.",
		color: "from-green-500/20 to-green-600/5",
		accent: "text-green-400",
	},
	{
		icon: <Bot className="h-5 w-5" />,
		title: "AI Outreach",
		description:
			"Personalized cold emails written and sent by AI. Replies land in your inbox.",
		color: "from-purple-500/20 to-purple-600/5",
		accent: "text-purple-400",
	},
	{
		icon: <BarChart3 className="h-5 w-5" />,
		title: "Pipeline Analytics",
		description:
			"Track leads from discovery to reply. Know exactly what's working.",
		color: "from-yellow-500/20 to-yellow-600/5",
		accent: "text-yellow-400",
	},
	{
		icon: <Plug className="h-5 w-5" />,
		title: "CRM Sync",
		description:
			"Push qualified leads to your CRM via webhook or native integrations.",
		color: "from-rose-500/20 to-rose-600/5",
		accent: "text-rose-400",
	},
	{
		icon: <Bell className="h-5 w-5" />,
		title: "Real-time Alerts",
		description:
			"Get notified when a high-score lead replies or a campaign milestone hits.",
		color: "from-emerald-500/20 to-emerald-600/5",
		accent: "text-emerald-400",
	},
];

const STATS = [
	{ value: "231K+", label: "Leads Indexed" },
	{ value: "45x", label: "Faster Than Manual" },
	{ value: "98%", label: "Email Enrichment Rate" },
];

const fadeUp = {
	hidden: { opacity: 0, y: 24 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: i * 0.08,
			duration: 0.5,
			ease: "easeOut" as const,
		},
	}),
};

function HomeComponent() {
	return (
		<div className="min-h-screen bg-background">
			{/* Hero */}
			<section className="relative overflow-hidden px-4 pt-24 pb-20 text-center">
				{/* Gradient orbs */}
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="absolute top-0 left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/10 blur-[120px]" />
					<div className="absolute bottom-0 left-1/4 h-[300px] w-[400px] rounded-full bg-purple-500/8 blur-[100px]" />
				</div>

				<div className="mx-auto max-w-3xl space-y-6">
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4 }}
						className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-muted-foreground text-xs backdrop-blur"
					>
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
						231,834 leads indexed · Live
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, duration: 0.6 }}
						className="font-bold text-5xl sm:text-6xl"
						style={{ letterSpacing: "-0.02em" }}
					>
						Qualified B2B Leads,
						<br />
						<span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
							Delivered by AI
						</span>
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.5 }}
						className="mx-auto max-w-xl text-lg text-muted-foreground"
						style={{ letterSpacing: "-0.01em" }}
					>
						Synergine continuously discovers, scores, and enriches leads for
						your target market. Get API access or let our AI handle outreach —
						no setup required.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.32, duration: 0.5 }}
						className="flex flex-wrap items-center justify-center gap-3"
					>
						<a href="/login?redirect=/onboarding">
							<Button
								size="lg"
								className="relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_24px_rgba(var(--primary-rgb,99,102,241),0.5)]"
							>
								Start Free Trial
							</Button>
						</a>
						<a href="#pricing">
							<Button variant="outline" size="lg">
								View Pricing
							</Button>
						</a>
					</motion.div>
				</div>
			</section>

			{/* Stats */}
			<section className="border-border/50 border-y bg-muted/20 py-8">
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
							<p
								className="font-bold text-3xl"
								style={{ letterSpacing: "-0.02em" }}
							>
								{value}
							</p>
							<p className="mt-0.5 text-muted-foreground text-xs">{label}</p>
						</motion.div>
					))}
				</div>
			</section>

			{/* Feature bento grid */}
			<section className="mx-auto max-w-5xl space-y-6 px-4 py-20">
				<motion.h2
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					className="text-center font-semibold text-2xl"
					style={{ letterSpacing: "-0.02em" }}
				>
					Everything you need to close deals
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
								<div
									className={`absolute inset-0 -z-10 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
								/>
								<CardHeader className="pb-2">
									<div
										className={`mb-2 w-fit rounded-lg bg-muted/60 p-2 ${accent}`}
									>
										{icon}
									</div>
									<CardTitle style={{ letterSpacing: "-0.01em" }}>
										{title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription>{description}</CardDescription>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			</section>

			{/* Pricing */}
			<section
				id="pricing"
				className="mx-auto max-w-5xl space-y-8 px-4 py-20"
			>
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					className="text-center"
				>
					<h2
						className="font-semibold text-2xl"
						style={{ letterSpacing: "-0.02em" }}
					>
						Simple, transparent pricing
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						Start free. Upgrade when you're ready to scale.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{PRICING_TIERS.map((tier, i) => (
						<motion.div
							key={tier.id}
							custom={i}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true }}
							variants={fadeUp}
							className="relative"
						>
							{tier.mostPopular && (
								<span className="absolute top-3 right-3 z-10 rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs font-medium">
									Most Popular
								</span>
							)}
							<Card
								className={`h-full flex flex-col border-border/60 bg-background/60 backdrop-blur transition-all duration-300 hover:shadow-lg ${tier.mostPopular ? "ring-1 ring-primary border-primary/50" : ""}`}
							>
								<CardHeader className="pb-4">
									<CardTitle
										className="text-lg"
										style={{ letterSpacing: "-0.01em" }}
									>
										{tier.name}
									</CardTitle>
									<div className="mt-2">
										<span
											className="font-bold text-4xl"
											style={{ letterSpacing: "-0.02em" }}
										>
											${tier.price}
										</span>
										<span className="text-muted-foreground text-sm">/mo</span>
									</div>
									<p className="text-muted-foreground text-xs">
										or ${tier.priceYearly}/year (save 20%)
									</p>
								</CardHeader>
								<CardContent className="flex flex-col flex-1 gap-4">
									<ul className="space-y-2 flex-1">
										{tier.features.map((feature) => (
											<li
												key={feature}
												className="flex items-center gap-2 text-sm"
											>
												<Check className="h-4 w-4 text-primary shrink-0" />
												{feature}
											</li>
										))}
									</ul>
									<a
										href={tier.polarCheckoutUrl}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Button
											className="w-full"
											variant={tier.mostPopular ? "default" : "outline"}
										>
											Get Started
										</Button>
									</a>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border/50 py-8 text-center text-muted-foreground text-sm">
				<p>© 2026 Synergine. All rights reserved.</p>
				<div className="mt-2 flex justify-center gap-6">
					<a
						href="/privacy"
						className="hover:text-foreground transition-colors"
					>
						Privacy
					</a>
					<a href="/terms" className="hover:text-foreground transition-colors">
						Terms
					</a>
					<a
						href="mailto:hello@synergine.app"
						className="hover:text-foreground transition-colors"
					>
						Contact
					</a>
				</div>
			</footer>
		</div>
	);
}
