import { ArrowRight, Check, ChevronDown, IndianRupee, Lock, Scale, Wrench } from "lucide-react";
import { TrackedLink } from "@/components/UI/TrackedLink";
import { StickyCta } from "@/components/Landing/StickyCta";
import { SiteNav } from "@/components/Landing/SiteNav";
import { SiteFooter } from "@/components/Landing/SiteFooter";
import { PromoVideo } from "@/components/Landing/PromoVideo";
import { ALL_TOOL_SLUGS } from "@/content/tools";
import { TEMPLATES } from "@/utils/payStory";
import { SPLIT_TTL_DAYS } from "@/utils/splitCloud";

const PROMISES = [
	{ icon: Scale, title: "Who owes whom, in seconds", body: "Split equally, by percentage or exact amounts, and settle in the fewest payments." },
	{ icon: IndianRupee, title: "Settle in one tap on UPI", body: "GPay, PhonePe, Paytm or any UPI app, with the amount filled in." },
	{ icon: Lock, title: "Private by design", body: "No signup. Groups stay on your device, and sharing is end-to-end encrypted." },
];

const STEPS = [
	["Add the people", "Everyone who shares the costs, or send a link and let them join."],
	["Add who paid what", "Each expense, who paid it and who it was for."],
	["Settle up", "See the fewest payments and pay each one by UPI."],
] as const;

const FAQS = [
	{
		q: "How do I split expenses among friends?",
		a: "Add everyone involved, enter who paid, select participants, and SplitBiller shows who owes whom.",
	},
	{
		q: "Can I split expenses without creating an account?",
		a: "Yes. SplitBiller works without login or signup.",
	},
	{
		q: "Is this better than Splitwise?",
		a: "If you need long-term tracking with accounts, use Splitwise. If you want to split without anyone signing up, and keep it private, SplitBiller is faster and simpler.",
	},
	{
		q: "Can I use this on mobile?",
		a: "Yes. It works in any browser, on any phone.",
	},
	{
		q: "Does it support different currencies?",
		a: "Yes: rupees by default, plus dollars, euros, pounds and yen.",
	},
	{
		q: "Do split pages store my data on a server?",
		a: `Yes, but end-to-end encrypted. Split pages are saved on our server so payments update live for everyone with the link. Each split is encrypted in your browser before upload, and the key stays in your link, which browsers never send to us. Our server only holds scrambled data that we can’t read, and every split is deleted automatically ${SPLIT_TTL_DAYS} days after it’s made. Groups you make in the app stay on your device unless you choose to share them, end-to-end encrypted.`,
	},
];

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

const SectionHeading = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
	<div className="mx-auto mb-10 max-w-2xl text-center">
		<h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{children}</h2>
		{sub && <p className="mt-3 text-lg text-ink-soft">{sub}</p>}
	</div>
);

export const LandingPage = () => {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink pb-20 sm:pb-0">
			{/* Timely, on-site announcement: answers the question people are searching right now */}
			<TrackedLink
				href="/upi-charges-above-2000"
				location="upi_fee_strip"
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
			</TrackedLink>

			<SiteNav />

			{/* Hero */}
			<header className="px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-24">
				<div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
					<div className="text-center lg:text-left">
						<h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] font-semibold leading-[1.05] text-ink">
							Split bills in ₹, settle&nbsp;with&nbsp;UPI
						</h1>
						<p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft lg:mx-0">
							Who owes whom in seconds — share privately, pay via UPI. No signup, no app download.
						</p>
						<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
							<TrackedLink
								id="hero-cta"
								href="/dashboard"
								location="hero"
								className="btn-primary w-full sm:w-auto !px-6 !py-3.5 !text-base"
							>
								Split a bill now — free
								<ArrowRight className="h-4 w-4" />
							</TrackedLink>
							<TrackedLink href="/tools" location="hero_tools" className="btn-secondary w-full sm:w-auto !px-6 !py-3.5 !text-base">
								Try a quick calculator
							</TrackedLink>
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

			{/* Three promises */}
			<section className="border-t border-line bg-surface px-4 sm:px-6 py-14 sm:py-16">
				<div className="mx-auto max-w-6xl">
					<h2 className="sr-only">Why SplitBiller</h2>
					<ul className="grid gap-8 sm:grid-cols-3 sm:gap-10">
						{PROMISES.map(({ icon: Icon, title, body }) => (
							<li key={title}>
								<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
									<Icon className="h-5 w-5 text-brand-700" strokeWidth={1.75} />
								</span>
								<h3 className="mt-4 font-semibold text-ink">{title}</h3>
								<p className="mt-1 text-ink-soft">{body}</p>
							</li>
						))}
					</ul>
					<div className="mt-10 text-center">
						<TrackedLink href="/features" location="promises" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
							See everything SplitBiller does <ArrowRight className="h-4 w-4" />
						</TrackedLink>
					</div>
				</div>
			</section>

			{/* Video */}
			<section className="px-4 sm:px-6 py-16 sm:py-20">
				<div className="mx-auto max-w-4xl">
					<SectionHeading>See it in action</SectionHeading>
					<PromoVideo />
				</div>
			</section>

			{/* Tools */}
			<section className="px-4 sm:px-6 pb-16 sm:pb-20">
				<div className="surface mx-auto flex max-w-4xl flex-col items-center gap-6 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
					<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50">
						<Wrench className="h-6 w-6 text-brand-700" strokeWidth={1.75} />
					</span>
					<div className="min-w-0 flex-1">
						<h2 className="font-display text-2xl font-semibold text-ink">
							{ALL_TOOL_SLUGS.length} free calculators and {TEMPLATES.length} split-link templates
						</h2>
						<p className="mt-1 text-ink-soft">
							Restaurant bills, rent, trips, GST, UPI fees, Secret Santa and more. No signup.
						</p>
					</div>
					<TrackedLink href="/tools" location="tools_band" className="btn-primary shrink-0">
						Browse all tools <ArrowRight className="h-4 w-4" />
					</TrackedLink>
				</div>
			</section>

			{/* How it works */}
			<section className="border-t border-line bg-surface px-4 sm:px-6 py-16 sm:py-20">
				<div className="mx-auto max-w-5xl">
					<SectionHeading sub="Debts are simplified automatically, so fewer payments are needed.">How it works</SectionHeading>
					<ol className="grid gap-8 sm:grid-cols-3">
						{STEPS.map(([title, body], i) => (
							<li key={title} className="text-center">
								<span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 font-semibold tabular-nums text-brand-700">
									{i + 1}
								</span>
								<h3 className="mt-4 font-semibold text-ink">{title}</h3>
								<p className="mt-1 text-ink-soft">{body}</p>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* Privacy */}
			<section className="px-4 sm:px-6 py-16 sm:py-20">
				<div className="mx-auto grid max-w-5xl gap-8 rounded-3xl bg-brand-900 p-8 text-white sm:p-12 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
					<div>
						<Lock className="h-7 w-7 text-brand-300" strokeWidth={1.75} />
						<h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Private by design</h2>
						<p className="mt-3 text-lg text-brand-100">Your money matters stay between you and your group.</p>
					</div>
					<ul className="space-y-3 text-brand-100 lg:self-center">
						{[
							"No account: nothing to sign up for, nothing to leak",
							"Groups stay on your device until you choose to share them",
							"Shared groups and links are end-to-end encrypted; the key never reaches our server",
							`Split pages are deleted automatically after ${SPLIT_TTL_DAYS} days`,
						].map((item) => (
							<li key={item} className="flex items-start gap-2.5">
								<Check className="mt-1 h-4 w-4 shrink-0 text-brand-300" />
								{item}
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* FAQ */}
			<section id="faq" className="scroll-mt-16 border-t border-line bg-surface px-4 sm:px-6 py-16 sm:py-20">
				<div className="mx-auto max-w-3xl">
					<SectionHeading>Frequently asked questions</SectionHeading>
					<div className="divide-y divide-line border-y border-line">
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

			<SiteFooter />
			<StickyCta targetId="hero-cta" />
		</main>
	);
};

