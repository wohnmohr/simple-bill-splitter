"use client";

import Link from "next/link";
import {
	Receipt,
	UserX,
	Globe,
	Lock,
	ArrowRightLeft,
	Zap,
	ArrowRight,
	UtensilsCrossed,
	Luggage,
	Home,
	Check,
	Minus,
	Percent,
	Scale,
	IndianRupee,
	UserMinus,
	ChevronDown,
	ShieldCheck,
	Calculator,
	Lightbulb,
	Bike,
	Split,
	QrCode,
	Car,
	HandCoins,
	Gift,
} from "lucide-react";
import { track } from "@/lib/analytics";
import { StickyCta } from "@/components/Landing/StickyCta";
import { ALL_TOOL_SLUGS, TOOL_PAGES, ToolSlug } from "@/content/tools";

const TOOL_ICONS: Record<ToolSlug, typeof Receipt> = {
	"restaurant-bill-splitter": UtensilsCrossed,
	"trip-expense-splitter": Luggage,
	"roommate-expense-splitter": Home,
	"upi-bill-splitter": IndianRupee,
	"split-bill-with-tip": Percent,
	"split-bill-with-tax": Receipt,
	"split-bill-unequally": Scale,
	"split-bill-without-signup": UserMinus,
	"splitwise-alternative": ArrowRightLeft,
	"upi-charges-above-2000": ShieldCheck,
	"upi-mdr-calculator": Calculator,
	"upi-payment-split-planner": Split,
	"upi-qr-code-generator": QrCode,
	"road-trip-cost-splitter": Car,
	"group-contribution-collector": HandCoins,
	"secret-santa-generator": Gift,
	"split-electricity-bill": Lightbulb,
	"split-swiggy-zomato-bill": Bike,
};

const TOOL_BLURBS: Record<ToolSlug, string> = {
	"restaurant-bill-splitter":
		"Dinner bill + tip or service charge, split among friends.",
	"trip-expense-splitter": "Hotels, rides, meals — settle the whole trip.",
	"roommate-expense-splitter": "Rent, utilities, and groceries without the spreadsheet.",
	"upi-bill-splitter": "Split in ₹ and open UPI pay links for each settlement.",
	"split-bill-with-tip": "Add a tip %, then divide fairly.",
	"split-bill-with-tax": "Include GST/sales tax in each person’s share.",
	"split-bill-unequally": "Custom amounts or percentages when orders differ.",
	"split-bill-without-signup": "Instant split — no account, no app download.",
	"splitwise-alternative": "Who owes whom, without forcing friends onto an app.",
	"upi-charges-above-2000": "New 0.4% UPI fee above ₹2,000 — who actually pays?",
	"upi-mdr-calculator": "Merchant fee on UPI payments above ₹2,000, instantly.",
	"upi-payment-split-planner": "Split up to ₹20,000 into ₹2,000 payments — see if it pays off.",
	"upi-qr-code-generator": "A UPI QR and pay link with your amount — free.",
	"road-trip-cost-splitter": "Fuel, tolls and parking, split per person.",
	"group-contribution-collector": "Collect equal shares for gifts and festivals.",
	"secret-santa-generator": "Private draw links — nobody sees who got whom.",
	"split-electricity-bill": "Fair shares by usage, AC hours or room.",
	"split-swiggy-zomato-bill": "Delivery fee, GST and discounts, split fairly.",
};

const PH_ICON =
	"https://ph-files.imgix.net/e82f50fe-9e12-48be-b029-948fa71563cd.png?auto=compress,format&codec=mozjpeg&cs=strip&fit=crop&h=32&w=32";

const WHY = [
	{ icon: Receipt, label: "Split bills online instantly" },
	{ icon: UserX, label: "No account, no app, no signup" },
	{ icon: Globe, label: "Works entirely in your browser" },
	{ icon: Lock, label: "Privacy-first — your splits stay on your device" },
	{ icon: ArrowRightLeft, label: 'Simple "who owes whom" result' },
	{ icon: Zap, label: "Lightweight & fast" },
];

const STEPS = [
	"Add people involved in the expense",
	"Enter each expense and who paid",
	"Select who shared that expense",
	"Instantly see who owes whom and how much",
];

const COMPARISON: { feature: string; us: boolean | string; them: boolean | string }[] = [
	{ feature: "Login required", us: false, them: true },
	{ feature: "App download", us: false, them: true },
	{ feature: "Account data stored", us: false, them: true },
	{ feature: "One-time use", us: true, them: false },
	{ feature: "Instant results", us: true, them: "Often slow" },
];

const FAQS = [
	{
		q: "How do I split expenses among friends?",
		a: "Add everyone involved, enter who paid, select participants, and the calculator shows who owes whom.",
	},
	{
		q: "Can I split expenses without creating an account?",
		a: "Yes. This tool works without login or signup.",
	},
	{
		q: "Is this better than Splitwise?",
		a: "If you need long-term tracking, use Splitwise. If you want instant bill splitting without login, this is faster and simpler.",
	},
	{
		q: "Can I use this on mobile?",
		a: "Yes. It's fully mobile-friendly and works in any browser.",
	},
	{
		q: "Does it support different currencies?",
		a: "Yes. The calculator works with any currency.",
	},
];

const Cell = ({ value, strong }: { value: boolean | string; strong?: boolean }) => {
	if (typeof value === "string") {
		return <span className="text-ink-muted">{value}</span>;
	}
	// Every SplitBiller answer is the favourable one, so it always gets the check.
	if (strong) {
		return (
			<span className="inline-flex items-center gap-1.5 font-semibold text-ink">
				<Check className="h-4 w-4 text-positive" strokeWidth={2.5} />
				{value ? "Yes" : "No"}
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1.5 text-ink-muted">
			<Minus className="h-4 w-4" />
			{value ? "Yes" : "No"}
		</span>
	);
};

/** A faithful, static preview of the settle-up screen. */
const SettlementPreview = () => (
	<div className="relative mx-auto w-full max-w-sm" aria-hidden>
		<div className="surface shadow-raised p-4 sm:p-5">
			<div className="flex items-start justify-between">
				<div>
					<p className="font-display text-xl font-semibold text-ink">Goa trip</p>
					<p className="text-sm text-ink-muted">4 members · 11 expenses</p>
				</div>
				<div className="text-right">
					<p className="label-text">Total</p>
					<p className="font-semibold tabular-nums text-ink">₹38,460</p>
				</div>
			</div>
			<div className="mt-4 space-y-2.5 border-t border-line pt-4">
				{[
					["Rohan", "Priya", "₹6,215"],
					["Aisha", "Priya", "₹2,940"],
				].map(([from, to, amt], i) => (
					<div key={from} className="rounded-xl border border-line p-3">
						<div className="flex items-center justify-between gap-2">
							<span className="flex items-center gap-1.5 font-semibold text-ink">
								{from}
								<ArrowRight className="h-3.5 w-3.5 text-ink-muted" />
								{to}
							</span>
							<span className="font-semibold tabular-nums text-ink">{amt}</span>
						</div>
						{i === 0 && (
							<div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-brand-700 py-2 text-sm font-semibold text-white">
								<IndianRupee className="h-3.5 w-3.5" />
								Pay {amt} with UPI
							</div>
						)}
					</div>
				))}
			</div>
		</div>
		<div className="surface absolute -bottom-5 -left-3 sm:-left-8 hidden sm:flex items-center gap-2 px-3 py-2 shadow-raised">
			<span className="flex h-6 w-6 items-center justify-center rounded-full bg-positive-soft">
				<Check className="h-3.5 w-3.5 text-positive" strokeWidth={3} />
			</span>
			<span className="text-sm font-medium text-ink">2 payments settle it</span>
		</div>
	</div>
);

export const LandingPage = () => {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink pb-20 sm:pb-0">
			{/* Timely, on-site announcement: answers the question people are searching right now */}
			<Link
				href="/upi-charges-above-2000"
				onClick={() => track("landing_cta_clicked", { location: "upi_fee_strip" })}
				className="block bg-brand-50 text-brand-900 transition-colors hover:bg-brand-100"
			>
				<span className="mx-auto flex min-h-9 max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium sm:text-sm">
					<span className="rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
						New
					</span>
					<span>
						UPI fee above ₹2,000 from 15 Oct — do <em className="not-italic font-semibold">you</em> pay?
					</span>
					<ArrowRight className="h-3.5 w-3.5 shrink-0" />
				</span>
			</Link>

			{/* Site nav */}
			<nav className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
					<Link href="/" className="flex items-center gap-2 shrink-0">
						<img src="/logo.png" alt="" className="h-8 w-8 object-contain scale-[1.6]" />
						<span className="font-display text-lg font-semibold text-ink">
							SplitBiller
						</span>
					</Link>
					<div className="flex items-center gap-1 sm:gap-2">
						<a href="#tools" className="btn-ghost hidden sm:inline-flex">
							Calculators
						</a>
						<a href="#faq" className="btn-ghost hidden sm:inline-flex">
							FAQ
						</a>
						<Link
							href="/dashboard"
							className="btn-primary !py-2"
							onClick={() => track("landing_cta_clicked", { location: "nav" })}
						>
							Open app
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<header className="px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-24">
				<div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
					<div className="text-center lg:text-left">
						<h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] font-semibold leading-[1.05] text-ink">
							Split bills in ₹, settle&nbsp;with&nbsp;UPI
						</h1>
						<p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft lg:mx-0">
							Who owes whom in seconds — share privately, pay via UPI. No signup,
							no app download.
						</p>
						<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
							<Link
								id="hero-cta"
								href="/dashboard"
								onClick={() => track("landing_cta_clicked", { location: "hero" })}
								className="btn-primary w-full sm:w-auto !px-6 !py-3.5 !text-base"
							>
								Split a bill now — free
								<ArrowRight className="h-4 w-4" />
							</Link>
							<a href="#tools" className="btn-secondary w-full sm:w-auto !px-6 !py-3.5 !text-base">
								Try a quick calculator
							</a>
						</div>
						<ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-ink-muted lg:justify-start">
							{["Free forever", "No sign-up", "Takes ~30 seconds"].map((t) => (
								<li key={t} className="inline-flex items-center gap-1.5">
									<Check className="h-4 w-4 text-positive" />
									{t}
								</li>
							))}
						</ul>
					</div>
					<SettlementPreview />
				</div>
			</header>

			{/* Quick tools — primary navigation to SEO pages */}
			<section id="tools" className="scroll-mt-16 border-t border-line bg-white px-4 sm:px-6 py-16 sm:py-20">
				<div className="mx-auto max-w-6xl">
					<div className="mb-8 max-w-2xl">
						<h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
							Quick calculators
						</h2>
						<p className="mt-2 text-ink-soft">
							Jump into a tool for your exact situation — then share the
							settlement with friends.
						</p>
					</div>
					<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{ALL_TOOL_SLUGS.map((slug) => {
							const config = TOOL_PAGES[slug];
							const Icon = TOOL_ICONS[slug];
							return (
								<li key={slug} className="overflow-hidden rounded-xl border border-line bg-white">
									<Link
										href={`/${slug}`}
										onClick={() =>
											track("landing_cta_clicked", {
												location: "tools_grid",
												tool: slug,
											})
										}
										className="group flex h-full items-start gap-3.5 p-5 transition-colors hover:bg-paper"
									>
										<Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" strokeWidth={1.75} />
										<span className="min-w-0">
											<span className="flex items-center gap-1 font-semibold text-ink">
												{config.title}
												<ArrowRight className="h-4 w-4 text-ink-muted opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
											</span>
											<span className="mt-1 block text-sm leading-snug text-ink-muted">
												{TOOL_BLURBS[slug]}
											</span>
										</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			</section>

			{/* Demo Section */}
			<section className="px-4 sm:px-6 py-16 sm:py-20">
				<div className="mx-auto max-w-4xl">
					<h2 className="mb-8 text-center font-display text-3xl sm:text-4xl font-semibold text-ink">
						See it in action
					</h2>
					<div className="surface w-full max-w-full overflow-hidden shadow-raised">
						<div
							className="relative w-full max-w-full"
							style={{
								paddingBottom: "calc(52.9688% + 41px)",
								height: 0,
							}}
						>
							<iframe
								src="https://demo.arcade.software/ziv5LbSvTljkl6cuICDu?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true"
								title="Create and Manage Group Trip Expenses"
								frameBorder="0"
								loading="lazy"
								allowFullScreen
								allow="clipboard-write"
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									colorScheme: "light",
								}}
							/>
						</div>
					</div>
				</div>
			</section>

			{/* How it works + Why */}
			<section className="border-t border-line bg-white px-4 sm:px-6 py-16 sm:py-20">
				<div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 lg:gap-20">
					<div>
						<h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
							How It Works (Simple & Fair)
						</h2>
						<ol className="mt-8 space-y-5">
							{STEPS.map((step, i) => (
								<li key={step} className="flex gap-4">
									<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold tabular-nums text-brand-700">
										{i + 1}
									</span>
									<span className="pt-1 font-medium text-ink">{step}</span>
								</li>
							))}
						</ol>
						<p className="mt-8 max-w-md text-ink-muted">
							All expenses are split equally, and debts are automatically
							simplified so fewer transactions are needed.
						</p>
					</div>
					<div>
						<h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
							Why Use This Expense Splitter?
						</h2>
						<p className="mt-2 text-ink-soft">A Splitwise alternative without the login.</p>
						<ul className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
							{WHY.map(({ icon: Icon, label }) => (
								<li key={label} className="flex items-start gap-3">
									<Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" strokeWidth={1.75} />
									<h3 className="font-medium text-ink">{label}</h3>
								</li>
							))}
						</ul>
					</div>
				</div>
			</section>

			{/* Comparison + Privacy */}
			<section className="px-4 sm:px-6 py-16 sm:py-20">
				<div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.4fr_1fr]">
					<div>
						<h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
							Splitwise Alternative Without Login
						</h2>
						<p className="mt-2 text-ink-soft">Unlike traditional expense apps:</p>
						<div className="surface mt-6 overflow-x-auto overscroll-x-contain">
							<table className="w-full min-w-[300px] text-sm sm:text-base">
								<thead>
									<tr className="border-b border-line text-left">
										<th className="p-3 sm:p-4 font-medium text-ink-muted">Feature</th>
										<th className="bg-brand-50/60 p-3 sm:p-4 font-semibold text-brand-800">
											SplitBiller
										</th>
										<th className="p-3 sm:p-4 font-medium text-ink-muted">Other apps</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{COMPARISON.map((row) => (
										<tr key={row.feature}>
											<td className="p-3 sm:p-4 font-medium text-ink">{row.feature}</td>
											<td className="bg-brand-50/60 p-3 sm:p-4">
												<Cell value={row.us} strong />
											</td>
											<td className="p-3 sm:p-4">
												<Cell value={row.them} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<p className="mt-4 text-sm text-ink-muted">
							This tool is designed for one-time expense splitting, not long-term
							tracking.
						</p>
					</div>

					<div className="rounded-2xl bg-brand-900 p-6 sm:p-8 text-white lg:mt-[4.5rem] lg:self-start">
						<Lock className="h-6 w-6 text-brand-300" strokeWidth={1.75} />
						<h2 className="mt-4 font-display text-2xl sm:text-3xl font-semibold">
							Privacy-First Expense Splitting
						</h2>
						<p className="mt-3 text-lg font-medium text-brand-100">
							Your data never leaves your device.
						</p>
						<ul className="mt-5 space-y-2.5 text-brand-100">
							{[
								"All calculations run locally in your browser",
								"Your expenses are never sent to our servers",
								"Share links are encrypted — only people with the link can read them",
							].map((item) => (
								<li key={item} className="flex items-start gap-2.5">
									<Check className="mt-1 h-4 w-4 shrink-0 text-brand-300" />
									{item}
								</li>
							))}
						</ul>
						<p className="mt-6 text-sm text-brand-200">
							Ideal if you want a private, anonymous expense splitter.
						</p>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section id="faq" className="scroll-mt-16 border-t border-line bg-white px-4 sm:px-6 py-16 sm:py-20">
				<div className="mx-auto max-w-3xl">
					<h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
						Frequently Asked Questions
					</h2>
					<div className="mt-8 divide-y divide-line border-y border-line">
						{FAQS.map(({ q, a }, i) => (
							<details key={q} className="group" open={i === 0}>
								<summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
									<h3 className="text-lg font-semibold text-ink">{q}</h3>
									<ChevronDown className="h-5 w-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
								</summary>
								<p className="-mt-1 pb-5 pr-9 text-ink-soft">{a}</p>
							</details>
						))}
					</div>
				</div>
			</section>

			{/* Final CTA Section */}
			<section className="px-4 sm:px-6 py-16 sm:py-24">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="font-display text-3xl sm:text-5xl font-semibold text-ink">
						Start Splitting Bills Now
					</h2>
					<p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
						No downloads, no accounts — split expenses instantly and move on.
					</p>
					<Link
						href="/dashboard"
						onClick={() => track("landing_cta_clicked", { location: "footer" })}
						className="btn-primary mt-8 !px-7 !py-3.5 !text-base"
					>
						Use the free expense splitter
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-line bg-white px-4 sm:px-6 py-10">
				<div className="mx-auto max-w-6xl">
					<div className="grid gap-8 md:grid-cols-[1fr_2fr]">
						<div>
							<Link href="/" className="flex items-center gap-2">
								<img src="/logo.png" alt="" className="h-8 w-8 object-contain scale-[1.6]" />
								<span className="font-display text-lg font-semibold text-ink">
									SplitBiller
								</span>
							</Link>
							<p className="mt-3 max-w-xs text-sm text-ink-muted">
								Split bills in ₹ and settle with UPI. No signup, no app download.
							</p>
							<a
								href="https://www.producthunt.com/products/split-biller?utm_source=badge&utm_medium=embed"
								target="_blank"
								rel="noopener noreferrer"
								className="btn-secondary mt-4 !py-2"
							>
								<img src={PH_ICON} alt="" className="h-4 w-4 rounded" />
								Find us on Product Hunt
							</a>
							<Link
								href="/feature-requests"
								className="mt-1 block py-2 text-sm font-medium text-brand-700 hover:underline"
							>
								Missing something? Request a feature
							</Link>
						</div>
						<div>
							<p className="label-text mb-3">All tools</p>
							<ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
								{ALL_TOOL_SLUGS.map((slug) => (
									<li key={slug}>
										<Link
											href={`/${slug}`}
											className="block py-1.5 text-sm text-ink-soft hover:text-brand-700 hover:underline"
										>
											{TOOL_PAGES[slug].title}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>
					<div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-sm text-ink-muted sm:flex-row sm:justify-between">
						<p>© {new Date().getFullYear()} splitbiller.com. All rights reserved.</p>
						<p>
							Created by{" "}
							<a
								href="https://www.wohnmohr.com"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-block py-1.5 font-medium text-ink-soft underline hover:text-brand-700"
							>
								wohnmohr
							</a>
						</p>
					</div>
				</div>
			</footer>
			<StickyCta targetId="hero-cta" />
		</main>
	);
};
