import { ArrowRight, Check, ChevronDown, IndianRupee, Lock, Scale } from "lucide-react";
import { TrackedLink } from "@/components/UI/TrackedLink";
import { StickyCta } from "@/components/Landing/StickyCta";
import { SiteNav } from "@/components/Landing/SiteNav";
import { SiteFooter } from "@/components/Landing/SiteFooter";
import { PromoVideo } from "@/components/Landing/PromoVideo";
import { HeroQuickAdd } from "@/components/Landing/HeroQuickAdd";
import { UpiQr } from "@/components/Settlements/UpiQr";
import { ALL_TOOL_SLUGS } from "@/content/tools";
import { SPLIT_TTL_DAYS } from "@/utils/splitCloud";
import { SITE_URL } from "@/lib/site";

// Bills get split at the table, on a phone with UPI apps; desktop visitors scan to continue there.
const PHONE_APP_URL = `${SITE_URL}/dashboard?utm_source=desktop_qr`;

const PROMISES = [
	{ icon: Scale, title: "Who owes whom, in seconds", body: "Split equally, by percentage or exact amounts, and settle in the fewest payments." },
	{ icon: IndianRupee, title: "Settle in one tap on UPI", body: "GPay, PhonePe, Paytm or any UPI app, with the amount filled in." },
	{ icon: Lock, title: "Private by design", body: "No signup. Groups stay on your device, and sharing is end-to-end encrypted." },
];

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

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
	<h2 className="mx-auto mb-10 max-w-2xl text-center font-display text-3xl font-semibold text-ink sm:text-4xl">{children}</h2>
);

export const LandingPage = () => {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink pb-20 sm:pb-0">
			<SiteNav />

			{/* Hero */}
			<header className="px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-24">
				<div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
					<div className="min-w-0 text-center lg:text-left">
						<h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] font-semibold leading-[1.05] text-ink">
							Split bills in&nbsp;₹, settle&nbsp;with&nbsp;UPI
						</h1>
						<p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft lg:mx-0">
							Who owes whom in seconds — share privately, pay via UPI. No signup, no app download.
						</p>
						<HeroQuickAdd />
						<TrackedLink
							id="hero-cta"
							href="/dashboard"
							location="hero"
							className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
						>
							Or open the app and add people first <ArrowRight className="h-4 w-4" />
						</TrackedLink>
						<div className="mt-8 hidden items-center gap-4 lg:flex">
							<UpiQr link={PHONE_APP_URL} label="QR code that opens SplitBiller on your phone" className="h-24 w-24" />
							<p className="text-sm text-ink-muted">
								<span className="font-medium text-ink">Splitting at the table?</span>
								<br />
								Scan to open SplitBiller on your phone, next to your UPI apps.
							</p>
						</div>
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
					<div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3">
						<TrackedLink href="/features" location="promises" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
							See everything SplitBiller does <ArrowRight className="h-4 w-4" />
						</TrackedLink>
						<TrackedLink href="/tools" location="promises_tools" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
							{ALL_TOOL_SLUGS.length} free calculators <ArrowRight className="h-4 w-4" />
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

