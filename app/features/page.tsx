import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SiteNav } from "@/components/Landing/SiteNav";
import { FeatureClip } from "@/components/Features/FeatureClip";
import { TrackedLink } from "@/components/UI/TrackedLink";
import { FEATURES } from "@/content/features";

export const metadata: Metadata = {
	title: "Features | SplitBiller",
	description:
		"Everything SplitBiller does, in short clips: groups without signup, equal or percentage splits, fewest-payment settle up, one-tap UPI, encrypted share links, synced groups, themes, split links and free calculators.",
	alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink">
			<SiteNav current="features" />

			<header className="px-4 pb-12 pt-12 text-center sm:px-6 sm:pb-16 sm:pt-20">
				<div className="mx-auto max-w-3xl">
					<p className="label-text">Features</p>
					<h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1.05]">
						Everything SplitBiller does
					</h1>
					<p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">
						Split bills, settle by UPI and share privately. Free, with no signup, and built so your money data stays
						yours.
					</p>
					<nav aria-label="Jump to a feature" className="mt-8 flex flex-wrap justify-center gap-2">
						{FEATURES.map((f) => (
							<a
								key={f.id}
								href={`#${f.id}`}
								className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700"
							>
								{f.eyebrow}
							</a>
						))}
					</nav>
				</div>
			</header>

			{FEATURES.map((f, i) => {
				const wide = !!f.clip.caption;
				return (
					<section
						key={f.id}
						id={f.id}
						aria-labelledby={`${f.id}-title`}
						className={`scroll-mt-14 px-4 py-14 sm:px-6 sm:py-20 ${i % 2 === 0 ? "border-y border-line bg-surface" : ""}`}
					>
						<div
							className={`mx-auto grid max-w-5xl items-center gap-10 lg:gap-16 ${
								wide ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]" : "lg:grid-cols-2"
							}`}
						>
							<div className={i % 2 && !wide ? "lg:order-2" : ""}>
								<p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{f.eyebrow}</p>
								<h2 id={`${f.id}-title`} className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
									{f.title}
								</h2>
								<p className="mt-4 text-lg text-ink-soft">{f.body}</p>
								<ul className="mt-6 space-y-2.5">
									{f.points.map((p) => (
										<li key={p} className="flex items-start gap-2.5 text-ink">
											<Check className="mt-1 h-4 w-4 shrink-0 text-positive" strokeWidth={2.5} />
											{p}
										</li>
									))}
								</ul>
								<TrackedLink
									href={f.cta.href}
									location="features"
									properties={{ feature: f.id }}
									className="btn-secondary mt-8"
								>
									{f.cta.label}
									<ArrowRight className="h-4 w-4" />
								</TrackedLink>
							</div>
							<FeatureClip {...f.clip} />
						</div>
					</section>
				);
			})}

			<section className="px-4 py-16 text-center sm:px-6 sm:py-24">
				<div className="mx-auto max-w-2xl">
					<h2 className="font-display text-3xl font-semibold sm:text-5xl">Split your next bill</h2>
					<p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
						Free forever, no signup, and it takes about thirty seconds.
					</p>
					<TrackedLink href="/dashboard" location="features_footer" className="btn-primary mt-8 !px-7 !py-3.5 !text-base">
						Open SplitBiller
						<ArrowRight className="h-4 w-4" />
					</TrackedLink>
					<p className="mt-6 text-sm text-ink-muted">
						Missing something?{" "}
						<Link href="/feature-requests" className="font-medium text-brand-700 hover:underline">
							Request a feature
						</Link>
					</p>
				</div>
			</section>
		</main>
	);
}
