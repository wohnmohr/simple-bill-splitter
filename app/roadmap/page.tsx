import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Download, Globe, Languages, Repeat, ScanLine } from "lucide-react";
import { SiteNav } from "@/components/Landing/SiteNav";
import { SiteFooter } from "@/components/Landing/SiteFooter";
import { TallyForm } from "@/components/UI/TallyForm";
import { REQUEST_FORM_ID, type PlannedItem, type RoadmapIcon } from "@/content/roadmap";
import { getRoadmap } from "@/lib/roadmap";

// Static, rebuilt in the background at most once a minute to pick up roadmap edits.
export const revalidate = 60;

export const metadata: Metadata = {
	title: "Roadmap | What SplitBiller is building next",
	description:
		"What's coming to SplitBiller: recurring expenses, scanning paper restaurant bills, exporting a group and more. See what just shipped and request a feature.",
	alternates: { canonical: "/roadmap" },
};

const ICONS: Record<RoadmapIcon, typeof Repeat> = {
	repeat: Repeat,
	scan: ScanLine,
	globe: Globe,
	download: Download,
	languages: Languages,
};

const Stage = ({ id, label, title, items, muted }: { id: string; label: string; title: string; items: PlannedItem[]; muted?: boolean }) => (
	<section aria-labelledby={id} className="px-4 py-10 sm:px-6 sm:py-12">
		<div className="mx-auto max-w-5xl">
			<p className="label-text">{label}</p>
			<h2 id={id} className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
				{title}
			</h2>
			<ul className="mt-6 grid gap-3 sm:grid-cols-3">
				{items.map((item) => {
					const Icon = ICONS[item.icon];
					return (
						<li key={item.title} className={`rounded-2xl border p-5 ${muted ? "border-line bg-paper" : "border-line bg-surface shadow-card"}`}>
							<span
								className={`flex h-10 w-10 items-center justify-center rounded-xl ${muted ? "bg-surface text-ink-soft" : "bg-brand-50 text-brand-700"}`}
							>
								<Icon className="h-5 w-5" strokeWidth={1.75} />
							</span>
							<h3 className="mt-4 font-semibold text-ink">{item.title}</h3>
							<p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
						</li>
					);
				})}
			</ul>
		</div>
	</section>
);

export default async function RoadmapPage() {
	const { next, later, shipped } = await getRoadmap();
	return (
		<main className="page-shell min-h-screen bg-paper text-ink">
			<SiteNav current="roadmap" />

			<header className="px-4 pb-4 pt-12 sm:px-6 sm:pt-16">
				<div className="mx-auto max-w-5xl">
					<p className="label-text">Roadmap</p>
					<h1 className="mt-3 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.5rem)] font-semibold leading-[1.05]">
						What we&apos;re building next
					</h1>
					<p className="mt-5 max-w-2xl text-lg text-ink-soft">
						SplitBiller grows from what people ask for. Here&apos;s what&apos;s coming, what just shipped, and where to tell us
						what you&apos;d like next.
					</p>
					<a href="#request" className="btn-primary mt-7">
						Request a feature <ArrowRight className="h-4 w-4" />
					</a>
				</div>
			</header>

			{next.length > 0 && <Stage id="next" label="Next up" title="Being built now" items={next} />}
			{later.length > 0 && <Stage id="later" label="Later" title="On the list" items={later} muted />}

			<section aria-labelledby="shipped" className="border-y border-line bg-surface px-4 py-12 sm:px-6 sm:py-14">
				<div className="mx-auto max-w-5xl">
					<p className="label-text">Shipped</p>
					<h2 id="shipped" className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
						Recently shipped
					</h2>
					{shipped.map(({ month, items }) => (
						<div key={month} className="mt-6">
							<h3 className="text-sm font-semibold text-ink-muted">{month}</h3>
							<ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
								{items.map((item) => (
									<li key={item.title}>
										<Link href={item.href} className="group flex items-center gap-3 border-b border-line py-3 text-ink hover:text-brand-700">
											<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-positive-soft">
												<Check className="h-3.5 w-3.5 text-positive" strokeWidth={2.5} />
											</span>
											<span className="min-w-0 flex-1 font-medium">{item.title}</span>
											<ArrowRight className="h-4 w-4 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100" />
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</section>

			<section id="request" aria-labelledby="request-title" className="scroll-mt-16 px-4 py-12 sm:px-6 sm:py-16">
				<div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-12">
					<div>
						<p className="label-text">Your turn</p>
						<h2 id="request-title" className="mt-2 font-display text-3xl font-semibold">
							Request a feature
						</h2>
						<p className="mt-3 text-ink-soft">
							Tell us what&apos;s missing and when you&apos;d use it, and tick the planned features you want most. The ones
							people ask for most move up the list.
						</p>
						<p className="mt-3 text-sm text-ink-muted">
							Leave an email only if you&apos;d like us to follow up. The form is run by Tally.
						</p>
					</div>
					<div className="surface px-3 py-4 sm:px-5 sm:py-6">
						<TallyForm formId={REQUEST_FORM_ID} title="Request a feature" source="roadmap" event="feature_request_submitted" height={760} />
					</div>
				</div>
			</section>

			<SiteFooter />
		</main>
	);
}
