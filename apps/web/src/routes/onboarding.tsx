import { Button } from "@synergine-app/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@synergine-app/ui/components/card";
import { Input } from "@synergine-app/ui/components/input";
import { Label } from "@synergine-app/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@synergine-app/ui/components/select";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			redirect({
				to: "/login",
				search: { redirect: "/onboarding" },
				throw: true,
			});
		}
		return { session };
	},
});

const INDUSTRIES = [
	"Wellness",
	"E-Commerce",
	"SaaS",
	"Agency",
	"Real Estate",
	"Finance",
	"Other",
];

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "200+"];

const API = "http://localhost:3001/api";

type FormData = {
	industry: string[];
	targets: {
		location: string;
		companySize: string;
		keywords: string;
	};
	smtpConfig: {
		host: string;
		port: number;
		username: string;
		password: string;
		fromName: string;
		fromEmail: string;
	} | null;
	smtpSkipped: boolean;
	smtpTested: boolean;
};

function StepIndicator({ current, total }: { current: number; total: number }) {
	return (
		<div className="mb-8">
			<p className="mb-3 text-center text-muted-foreground text-sm">
				Step {current} of {total}
			</p>
			<div className="flex items-center justify-center gap-3">
				{Array.from({ length: total }, (_, i) => {
					const stepNum = i + 1;
					const isCompleted = stepNum < current;
					const isActive = stepNum === current;
					return (
						<div key={stepNum} className="flex items-center gap-3">
							<div
								className={`flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm transition-all ${
									isCompleted
										? "bg-primary text-primary-foreground"
										: isActive
											? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
											: "bg-muted text-muted-foreground"
								}`}
							>
								{isCompleted ? <Check className="h-4 w-4" /> : stepNum}
							</div>
							{stepNum < total && (
								<div
									className={`h-px w-8 transition-all ${stepNum < current ? "bg-primary" : "bg-muted"}`}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function OnboardingComponent() {
	const navigate = useNavigate();
	const [step, setStep] = useState(1);
	const [formData, setFormData] = useState<FormData>({
		industry: [],
		targets: { location: "", companySize: "1-10", keywords: "" },
		smtpConfig: null,
		smtpSkipped: false,
		smtpTested: false,
	});
	const [smtpFields, setSmtpFields] = useState({
		host: "",
		port: 587,
		username: "",
		password: "",
		fromName: "",
		fromEmail: "",
	});
	const [smtpStatus, setSmtpStatus] = useState<
		"idle" | "testing" | "ok" | "error"
	>("idle");
	const [smtpError, setSmtpError] = useState<string | null>(null);
	const [activating, setActivating] = useState(false);

	const toggleIndustry = (industry: string) => {
		setFormData((prev) => ({
			...prev,
			industry: prev.industry.includes(industry)
				? prev.industry.filter((i) => i !== industry)
				: [...prev.industry, industry],
		}));
	};

	const testSmtp = async () => {
		setSmtpStatus("testing");
		setSmtpError(null);
		try {
			const res = await fetch(`${API}/onboarding/test-smtp`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(smtpFields),
			});
			const data = (await res.json()) as { success: boolean; error?: string };
			if (data.success) {
				setSmtpStatus("ok");
				setFormData((prev) => ({
					...prev,
					smtpTested: true,
					smtpConfig: smtpFields,
				}));
			} else {
				setSmtpStatus("error");
				setSmtpError(data.error ?? "Connection failed");
			}
		} catch {
			setSmtpStatus("error");
			setSmtpError("Network error");
		}
	};

	const skipSmtp = () => {
		setFormData((prev) => ({ ...prev, smtpSkipped: true, smtpConfig: null }));
		setStep(4);
	};

	const activate = async () => {
		setActivating(true);
		try {
			const res = await fetch(`${API}/onboarding/activate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					industry: formData.industry,
					targets: formData.targets,
					smtpConfig: formData.smtpConfig,
				}),
			});
			if (res.ok) {
				await navigate({ to: "/dashboard" });
			} else {
				const err = (await res.json()) as { error?: string };
				toast.error(err.error ?? "Activation failed");
			}
		} catch {
			toast.error("Network error during activation");
		} finally {
			setActivating(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
			<div className="w-full max-w-lg">
				<div className="mb-8 text-center">
					<h1
						className="font-bold text-3xl"
						style={{ letterSpacing: "-0.02em" }}
					>
						Set up your pipeline
					</h1>
					<p className="mt-2 text-muted-foreground text-sm">
						Tell us about your business so we can find the right leads.
					</p>
				</div>

				<StepIndicator current={step} total={4} />

				<AnimatePresence mode="wait">
					{step === 1 && (
						<motion.div
							key={1}
							initial={{ opacity: 0, x: 30 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -30 }}
							transition={{ duration: 0.2 }}
						>
							<Card>
								<CardHeader>
									<CardTitle>What industry are you in?</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="text-muted-foreground text-sm">
										Select all that apply. This helps us target the right leads.
									</p>
									<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
										{INDUSTRIES.map((industry) => {
											const selected = formData.industry.includes(industry);
											return (
												<button
													key={industry}
													type="button"
													onClick={() => toggleIndustry(industry)}
													className={`rounded-lg border px-3 py-2 font-medium text-sm transition-all ${
														selected
															? "border-primary bg-primary/10 text-primary"
															: "border-border bg-muted/30 text-foreground hover:border-primary/50 hover:bg-muted/60"
													}`}
												>
													{industry}
												</button>
											);
										})}
									</div>
									<div className="flex justify-end pt-2">
										<Button
											onClick={() => setStep(2)}
											disabled={formData.industry.length === 0}
										>
											Next
										</Button>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}

					{step === 2 && (
						<motion.div
							key={2}
							initial={{ opacity: 0, x: 30 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -30 }}
							transition={{ duration: 0.2 }}
						>
							<Card>
								<CardHeader>
									<CardTitle>Who are your target customers?</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="location">Target Location</Label>
										<Input
											id="location"
											placeholder="e.g. Munich, Germany"
											value={formData.targets.location}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													targets: {
														...prev.targets,
														location: e.target.value,
													},
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Company Size</Label>
										<Select
											value={formData.targets.companySize}
											onValueChange={(val) =>
												setFormData((prev) => ({
													...prev,
													targets: { ...prev.targets, companySize: val },
												}))
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{COMPANY_SIZES.map((size) => (
													<SelectItem key={size} value={size}>
														{size} employees
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="keywords">
											Keywords{" "}
											<span className="text-muted-foreground">(optional)</span>
										</Label>
										<Input
											id="keywords"
											placeholder="e.g. fitness, yoga, pilates"
											value={formData.targets.keywords}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													targets: {
														...prev.targets,
														keywords: e.target.value,
													},
												}))
											}
										/>
										<p className="text-muted-foreground text-xs">
											Comma-separated keywords to refine lead matching.
										</p>
									</div>
									<div className="flex justify-between pt-2">
										<Button variant="ghost" onClick={() => setStep(1)}>
											Back
										</Button>
										<Button
											onClick={() => setStep(3)}
											disabled={!formData.targets.location.trim()}
										>
											Next
										</Button>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}

					{step === 3 && (
						<motion.div
							key={3}
							initial={{ opacity: 0, x: 30 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -30 }}
							transition={{ duration: 0.2 }}
						>
							<Card>
								<CardHeader>
									<CardTitle>Email Configuration</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="text-muted-foreground text-sm">
										Connect your SMTP server to enable AI outreach. You can skip
										this and configure later.
									</p>
									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-2">
											<Label htmlFor="smtp-host">SMTP Host</Label>
											<Input
												id="smtp-host"
												placeholder="smtp.example.com"
												value={smtpFields.host}
												onChange={(e) =>
													setSmtpFields((p) => ({
														...p,
														host: e.target.value,
													}))
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="smtp-port">Port</Label>
											<Input
												id="smtp-port"
												type="number"
												placeholder="587"
												value={smtpFields.port}
												onChange={(e) =>
													setSmtpFields((p) => ({
														...p,
														port: Number(e.target.value),
													}))
												}
											/>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-2">
											<Label htmlFor="smtp-user">Username</Label>
											<Input
												id="smtp-user"
												placeholder="user@example.com"
												value={smtpFields.username}
												onChange={(e) =>
													setSmtpFields((p) => ({
														...p,
														username: e.target.value,
													}))
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="smtp-pass">Password</Label>
											<Input
												id="smtp-pass"
												type="password"
												placeholder="••••••••"
												value={smtpFields.password}
												onChange={(e) =>
													setSmtpFields((p) => ({
														...p,
														password: e.target.value,
													}))
												}
											/>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-2">
											<Label htmlFor="smtp-from-name">From Name</Label>
											<Input
												id="smtp-from-name"
												placeholder="Acme Corp"
												value={smtpFields.fromName}
												onChange={(e) =>
													setSmtpFields((p) => ({
														...p,
														fromName: e.target.value,
													}))
												}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="smtp-from-email">From Email</Label>
											<Input
												id="smtp-from-email"
												placeholder="hello@acme.com"
												value={smtpFields.fromEmail}
												onChange={(e) =>
													setSmtpFields((p) => ({
														...p,
														fromEmail: e.target.value,
													}))
												}
											/>
										</div>
									</div>

									{smtpStatus === "ok" && (
										<div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-500 text-sm">
											<Check className="h-4 w-4" />
											Connection successful
										</div>
									)}
									{smtpStatus === "error" && (
										<div className="rounded-lg bg-red-500/10 px-3 py-2 text-red-500 text-sm">
											{smtpError}
										</div>
									)}

									<div className="flex flex-col gap-2">
										<Button
											variant="outline"
											onClick={testSmtp}
											disabled={
												smtpStatus === "testing" || !smtpFields.host.trim()
											}
										>
											{smtpStatus === "testing"
												? "Testing..."
												: "Test Connection"}
										</Button>
									</div>

									<div className="flex items-center justify-between pt-2">
										<Button variant="ghost" onClick={() => setStep(2)}>
											Back
										</Button>
										<div className="flex items-center gap-3">
											<button
												type="button"
												onClick={skipSmtp}
												className="text-muted-foreground text-sm hover:text-foreground"
											>
												Skip for now
											</button>
											<Button
												onClick={() => setStep(4)}
												disabled={!formData.smtpTested && !formData.smtpSkipped}
											>
												Next
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}

					{step === 4 && (
						<motion.div
							key={4}
							initial={{ opacity: 0, x: 30 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -30 }}
							transition={{ duration: 0.2 }}
						>
							<Card>
								<CardHeader>
									<CardTitle>Review &amp; Activate</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="text-muted-foreground text-sm">
										Confirm your setup before activating your pipeline.
									</p>

									<div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Industry</span>
											<span className="font-medium">
												{formData.industry.join(", ")}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Location</span>
											<span className="font-medium">
												{formData.targets.location}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Company Size
											</span>
											<span className="font-medium">
												{formData.targets.companySize}
											</span>
										</div>
										{formData.targets.keywords && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Keywords</span>
												<span className="font-medium">
													{formData.targets.keywords}
												</span>
											</div>
										)}
										<div className="flex justify-between">
											<span className="text-muted-foreground">Plan</span>
											<span className="font-medium">Starter (free trial)</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">SMTP</span>
											<span className="font-medium">
												{formData.smtpConfig ? "Configured" : "Not configured"}
											</span>
										</div>
									</div>

									<div className="flex items-center justify-between pt-2">
										<Button variant="ghost" onClick={() => setStep(3)}>
											Back
										</Button>
										<Button
											onClick={activate}
											disabled={activating}
											className="min-w-[140px] bg-indigo-600 hover:bg-indigo-700"
										>
											{activating ? "Activating..." : "Activate Pipeline"}
										</Button>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
