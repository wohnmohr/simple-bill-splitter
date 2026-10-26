import type { Metadata } from "next";
import {
	ArrowRight, ArrowRightLeft, BadgePercent, Bike, Calculator, Car, Dices, Gift, HandCoins, Home, IndianRupee,
	Lightbulb, Luggage, Percent, QrCode, Receipt, Ruler, Scale, ShieldCheck, Split, Tag, Users, UtensilsCrossed,
} from "lucide-react";
import { SiteNav } from "@/components/Landing/SiteNav";
import { SiteFooter } from "@/components/Landing/SiteFooter";
import { TrackedLink } from "@/components/UI/TrackedLink";
import { themeGradient } from "@/components/PayStory/TemplateGrid";
import { ALL_TOOL_SLUGS, TOOL_PAGES, type ToolSlug } from "@/content/tools";
import { TEMPLATES } from "@/utils/payStory";

export const metadata: Metadata = {
	title: "Free bill-splitting tools and calculators | SplitBiller",
	description:
		"Every SplitBiller tool in one place: split links that collect money by UPI, restaurant, trip, rent and electricity splitters, GST and UPI fee calculators, Secret Santa and more. Free, no signup.",
	alternates: { canonical: "/tools" },
};

const TOOLS: Record<ToolSlug, { icon: typeof Receipt; blurb: string }> = {
	"restaurant-bill-splitter": { icon: UtensilsCrossed, blurb: "Dinner bill with tip or service charge, split among friends." },
	"split-bill-with-tip": { icon: Percent, blurb: "Add a tip %, then divide fairly." },
	"split-bill-with-tax": { icon: Receipt, blurb: "Include GST or sales tax in each person’s share." },
	"split-bill-unequally": { icon: Scale, blurb: "Custom amounts or percentages when orders differ." },
	"split-swiggy-zomato-bill": { icon: Bike, blurb: "Delivery fee, GST and discounts, split fairly." },
	"splitwise-alternative": { icon: ArrowRightLeft, blurb: "Who owes whom, without forcing friends onto an app." },
	"trip-expense-splitter": { icon: Luggage, blurb: "Hotels, rides, meals: settle the whole trip." },
	"road-trip-cost-splitter": { icon: Car, blurb: "Fuel, tolls and parking, split per person." },
	"roommate-expense-splitter": { icon: Home, blurb: "Rent, utilities and groceries without the spreadsheet." },
	"split-rent-by-room-size": { icon: Ruler, blurb: "Fair rent when bedrooms differ in size." },
	"split-electricity-bill": { icon: Lightbulb, blurb: "Fair shares by usage, AC hours or room." },
	"group-contribution-collector": { icon: HandCoins, blurb: "Collect equal shares for gifts and festivals." },
	"upi-bill-splitter": { icon: IndianRupee, blurb: "Split in ₹ and open UPI pay links for each settlement." },
	"upi-charges-above-2000": { icon: ShieldCheck, blurb: "The 0.4% UPI fee above ₹2,000: who actually pays?" },
	"upi-mdr-calculator": { icon: Calculator, blurb: "Merchant fee on UPI payments above ₹2,000, instantly." },
	"upi-payment-split-planner": { icon: Split, blurb: "Split up to ₹20,000 into ₹2,000 payments." },
	"upi-qr-code-generator": { icon: QrCode, blurb: "A UPI QR and pay link with your amount, free." },
	"gst-calculator": { icon: BadgePercent, blurb: "Add or remove GST, with the CGST/SGST breakup." },
	"discount-calculator": { icon: Tag, blurb: "The true price after stacked discounts." },
	"secret-santa-generator": { icon: Gift, blurb: "Private draw links: nobody sees who got whom." },
	"random-name-picker": { icon: Dices, blurb: "Spin a wheel to pick a name. Who pays?" },
	"random-team-generator": { icon: Users, blurb: "Shuffle names into fair, even teams." },
};

const GROUPS: { id: string; title: string; slugs: ToolSlug[] }[] = [
	{
		id: "split-a-bill",
		title: "Split a bill",
		slugs: ["restaurant-bill-splitter", "split-bill-with-tip", "split-bill-with-tax", "split-bill-unequally", "split-swiggy-zomato-bill", "splitwise-alternative"],
	},
	{ id: "trips-and-home", title: "Trips and home", slugs: ["trip-expense-splitter", "road-trip-cost-splitter", "roommate-expense-splitter", "split-rent-by-room-size", "split-electricity-bill", "group-contribution-collector"] },
	{ id: "upi", title: "UPI payments", slugs: ["upi-bill-splitter", "upi-charges-above-2000", "upi-mdr-calculator", "upi-payment-split-planner", "upi-qr-code-generator"] },
	{ id: "everyday", title: "Everyday calculators", slugs: ["gst-calculator", "discount-calculator"] },
	{ id: "with-friends", title: "Fun with friends", slugs: ["secret-santa-generator", "random-name-picker", "random-team-generator"] },
];
// A new tool never goes missing: anything not grouped above is listed under "More".
const ungrouped = ALL_TOOL_SLUGS.filter((s) => !GROUPS.some((g) => g.slugs.includes(s)));
const SECTIONS = ungrouped.length ? [...GROUPS, { id: "more", title: "More", slugs: ungrouped }] : GROUPS;

export default function ToolsPage() {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink">
			<SiteNav current="tools" />

			<header className="px-4 pb-10 pt-12 text-center sm:px-6 sm:pb-12 sm:pt-16">
				<div className="mx-auto max-w-3xl">
					<p className="label-text">Tools</p>
					<h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.5rem)] font-semibold leading-[1.05]">Free tools for splitting money</h1>
					<p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">
						Split links that collect money for you, and a calculator for every situation. No signup.
					</p>
					<nav aria-label="Jump to a section" className="mt-8 flex flex-wrap justify-center gap-2">
						{[{ id: "split-links", title: "Split links" }, ...SECTIONS].map((s) => (
							<a
								key={s.id}
								href={`#${s.id}`}
								className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700"
							>
								{s.title}
							</a>
						))}
					</nav>
				</div>
			</header>

			{/* Split links: one themed page per situation */}
			<section id="split-links" aria-labelledby="split-links-title" className="scroll-mt-16 border-y border-line bg-surface px-4 py-14 sm:px-6 sm:py-16">
				<div className="mx-auto max-w-6xl">
					<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div className="max-w-2xl">
							<h2 id="split-links-title" className="font-display text-3xl font-semibold">Split links</h2>
							<p className="mt-2 text-ink-soft">
								Pick what you’re splitting, set the total and your UPI ID, and share one link. Friends pay you directly
								and everyone sees who’s paid, live. End-to-end encrypted.
							</p>
						</div>
						<TrackedLink href="/split" location="tools_splits" className="btn-primary shrink-0 self-start sm:self-auto">
							Create a split link <ArrowRight className="h-4 w-4" />
						</TrackedLink>
					</div>
					<ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
						{TEMPLATES.map((t) => (
							<li key={t.id} className="min-w-0">
								<TrackedLink
									href={`/split/${t.id}`}
									location="tools_splits"
									properties={{ tool: t.id }}
									className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-card"
								>
									<span aria-hidden className="flex h-14 items-center justify-center text-2xl" style={{ background: themeGradient(t) }}>
										{t.emoji}
									</span>
									<span className="p-2.5 text-sm font-semibold leading-snug text-ink group-hover:text-brand-700">{t.label}</span>
								</TrackedLink>
							</li>
						))}
					</ul>
				</div>
			</section>

			{SECTIONS.map((group) => (
				<section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className="scroll-mt-16 px-4 py-12 sm:px-6 sm:py-14">
					<div className="mx-auto max-w-6xl">
						<h2 id={`${group.id}-title`} className="mb-6 font-display text-2xl font-semibold sm:text-3xl">
							{group.title}
						</h2>
						<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{group.slugs.map((slug) => {
								const { icon: Icon, blurb } = TOOLS[slug];
								return (
									<li key={slug}>
										<TrackedLink
											href={`/${slug}`}
											location="tools_page"
											properties={{ tool: slug }}
											className="group flex h-full items-start gap-3.5 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand-300"
										>
											<Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" strokeWidth={1.75} />
											<span className="min-w-0">
												<span className="flex items-center gap-1 font-semibold text-ink">
													{TOOL_PAGES[slug].title}
													<ArrowRight className="h-4 w-4 -translate-x-1 text-ink-muted opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
												</span>
												<span className="mt-1 block text-sm leading-snug text-ink-muted">{blurb}</span>
											</span>
										</TrackedLink>
									</li>
								);
							})}
						</ul>
					</div>
				</section>
			))}

			<SiteFooter />
		</main>
	);
}
