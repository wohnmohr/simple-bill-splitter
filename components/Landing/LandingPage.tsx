import { ArrowRight, ChevronDown, IndianRupee, Lock, Scale } from "lucide-react";
import { SettlementPreview } from "@/components/Landing/SettlementPreview";
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

// Bills get split at the table, on a phone; desktop visitors scan to continue there.
const PHONE_APP_URL = `${SITE_URL}/dashboard?utm_source=desktop_qr`;

const PROMISES = [
	{ icon: Scale, title: "Who owes whom, in seconds", body: "Split equally, by percentage or exact amounts, and settle in the fewest payments." },
	{ icon: IndianRupee, title: "One-tap UPI in India", body: "Rupee groups pay through GPay, PhonePe, Paytm or any UPI app, with the amount filled in. Every other currency settles up and marks it paid." },
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
		a: "Yes: rupees, dollars, euros, pounds and yen. New groups start in your local currency, and rupee groups also get one-tap UPI pay links.",
	},
	{
		q: "Do split pages store my data on a server?",
		a: `Yes, but end-to-end encrypted. Split pages are saved on our server so payments update live for everyone with the link. Each split is encrypted in your browser before upload, and the key stays in your link, which browsers never send to us. Our server only holds scrambled data that we can’t read, and every split is deleted automatically ${SPLIT_TTL_DAYS} days after it’s made. Groups you make in the app stay on your device unless you choose to share them, end-to-end encrypted.`,
	},
];

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
							Split bills, privately
						</h1>
						<p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft lg:mx-0">
							Who owes whom in seconds, shared end-to-end encrypted. No signup, no app download.
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
								Scan to open SplitBiller on your phone.
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

