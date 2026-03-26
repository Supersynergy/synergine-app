export const PRICING_TIERS = [
	{
		id: "starter",
		name: "Starter",
		price: 49,
		priceYearly: 470,
		polarProductId: "polar_starter_placeholder",
		polarCheckoutUrl: "https://polar.sh/synergine/checkout/starter",
		limits: { leadsPerMonth: 500, apiRequestsPerMin: 100, emailsPerDay: 50 },
		features: [
			"500 leads/month",
			"Lead scoring",
			"Email enrichment",
			"API access",
			"CSV export",
		],
		mostPopular: false,
	},
	{
		id: "growth",
		name: "Growth",
		price: 149,
		priceYearly: 1430,
		polarProductId: "polar_growth_placeholder",
		polarCheckoutUrl: "https://polar.sh/synergine/checkout/growth",
		limits: {
			leadsPerMonth: 2000,
			apiRequestsPerMin: 500,
			emailsPerDay: 200,
		},
		features: [
			"2,000 leads/month",
			"Lead scoring",
			"Email enrichment",
			"AI outreach",
			"Pipeline analytics",
			"CRM sync",
			"Priority support",
		],
		mostPopular: true,
	},
	{
		id: "enterprise",
		name: "Enterprise",
		price: 499,
		priceYearly: 4790,
		polarProductId: "polar_enterprise_placeholder",
		polarCheckoutUrl: "https://polar.sh/synergine/checkout/enterprise",
		limits: {
			leadsPerMonth: 10000,
			apiRequestsPerMin: 2000,
			emailsPerDay: 1000,
		},
		features: [
			"10,000 leads/month",
			"All Growth features",
			"Real-time alerts",
			"Dedicated support",
			"Custom integrations",
			"SLA guarantee",
		],
		mostPopular: false,
	},
] as const;

export type PricingTier = (typeof PRICING_TIERS)[number];
export type PlanId = PricingTier["id"];
