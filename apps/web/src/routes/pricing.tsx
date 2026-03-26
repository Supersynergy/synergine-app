import { PRICING_TIERS } from "@synergine-app/config";
import { Badge } from "@synergine-app/ui/components/badge";
import { Button } from "@synergine-app/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@synergine-app/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/pricing")({
	component: PricingComponent,
	beforeLoad: async () => {
		// Non-throwing — public page, session is optional for email pre-fill
		const session = await authClient.getSession();
		return { session: session.data ?? null };
	},
});

const fadeUp = {
	hidden: { opacity: 0, y: 20 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: i * 0.1, duration: 0.45, ease: "easeOut" as const },
	}),
};

function PricingComponent() {
	const { session } = Route.useRouteContext();

	const handleCheckout = (checkoutUrl: string) => {
		const email = session?.user?.email;
		const url = email
			? `${checkoutUrl}?customer_email=${encodeURIComponent(email)}`
			: checkoutUrl;
		toast("Redirecting to checkout...", { duration: 2000 });
		window.location.href = url;
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute top-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/8 blur-[100px]" />
			</div>

			<main className="mx-auto max-w-5xl px-4 py-20">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-12 text-center"
				>
					<h1
						className="font-bold text-4xl sm:text-5xl"
						style={{ letterSpacing: "-0.02em" }}
					>
						Simple, transparent pricing
					</h1>
					<p className="mt-3 text-muted-foreground">
						Start free. Upgrade when you're ready to scale.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{PRICING_TIERS.map((tier, i) => (
						<motion.div
							key={tier.id}
							custom={i}
							initial="hidden"
							animate="visible"
							variants={fadeUp}
							className="relative"
						>
							{tier.mostPopular && (
								<div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
									<Badge className="bg-primary px-3 text-primary-foreground text-xs">
										Most Popular
									</Badge>
								</div>
							)}
							<Card
								className={`flex h-full flex-col border-border/60 bg-background/60 backdrop-blur transition-all duration-300 hover:shadow-xl ${
									tier.mostPopular
										? "border-primary/50 ring-1 ring-primary"
										: ""
								}`}
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
								<CardContent className="flex flex-1 flex-col gap-4">
									<ul className="flex-1 space-y-2">
										{tier.features.map((feature) => (
											<li
												key={feature}
												className="flex items-center gap-2 text-sm"
											>
												<Check className="h-4 w-4 shrink-0 text-primary" />
												{feature}
											</li>
										))}
									</ul>
									<Button
										className="w-full"
										variant={tier.mostPopular ? "default" : "outline"}
										onClick={() => handleCheckout(tier.polarCheckoutUrl)}
									>
										Get Started
									</Button>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="mt-10 text-center text-muted-foreground text-sm"
				>
					All plans include a 14-day free trial. No credit card required.
				</motion.p>
			</main>
		</div>
	);
}
