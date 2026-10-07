import Link from "next/link";
import { ArrowRight, Lock, ChevronDown } from "lucide-react";
import { ToolPageConfig, TOOL_PAGES } from "@/content/tools";
import { ToolCalculator } from "@/components/Tools/ToolCalculator";
import { TrackedLink } from "@/components/UI/TrackedLink";

export function ToolJsonLd({ config }: { config: ToolPageConfig }) {
	const site = process.env.NEXT_PUBLIC_SITE_URL || "https://splitbiller.com";
	const faqLd = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: config.faqs.map((f) => ({
			"@type": "Question",
			name: f.q,
			acceptedAnswer: {
				"@type": "Answer",
				text: f.a,
			},
		})),
	};
	const appLd = {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: `SplitBiller — ${config.title}`,
		url: `${site}/${config.slug}`,
		applicationCategory: config.schemaCategory ?? "FinanceApplication",
		operatingSystem: "Any",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "INR",
		},
		description: config.metaDescription,
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
			/>
		</>
	);
}

export const ToolPageLayout = ({ config }: { config: ToolPageConfig }) => {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink">
			<ToolJsonLd config={config} />

			<header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md px-4 sm:px-6">
				<div className="max-w-5xl mx-auto flex h-14 items-center justify-between gap-3 min-w-0">
					<Link href="/" className="flex items-center gap-2 group">
						<img src="/logo-mark.webp" alt="" width={35} height={30} className="h-[30px] w-[35px] shrink-0 object-contain" />
						<span className="font-display text-lg font-semibold text-ink">
							SplitBiller
						</span>
					</Link>
					<TrackedLink
						href="/dashboard"
						location="tool_page_nav"
						className="btn-primary !py-2"
					>
						Open app
					</TrackedLink>
				</div>
			</header>

			<section className="px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
				<div className="max-w-5xl mx-auto text-center space-y-3 sm:space-y-4">
										<h1 className="font-display text-[clamp(1.875rem,5vw,3.25rem)] font-semibold text-ink leading-[1.08]">
						{config.headline}
					</h1>
					<p className="text-base sm:text-lg text-ink-soft max-w-2xl mx-auto">
						{config.subhead}
					</p>
					{config.updated && (
						<p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
							Updated {config.updated}
						</p>
					)}
					<p className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
						<Lock className="h-3.5 w-3.5" />
						{config.privacyNote ?? "Share links encrypt in your browser — we never store the split"}
					</p>
				</div>
			</section>

			<section className="px-4 sm:px-6 pb-10 sm:pb-14">
				<div className="max-w-5xl mx-auto min-w-0 w-full">
					<ToolCalculator kind={config.calculator} />
				</div>
			</section>

			<section className="px-4 sm:px-6 py-8 sm:py-10">
				<div className="max-w-3xl mx-auto space-y-4">
					{config.intro.map((p, i) => (
						<p key={i} className="text-base text-ink-soft leading-relaxed">
							{p}
						</p>
					))}
				</div>
			</section>

			<section className="px-4 sm:px-6 py-12 sm:py-16 bg-white border-y border-line">
				<div className="max-w-3xl mx-auto">
					<h2 className="text-xl sm:text-2xl font-bold text-ink mb-6 text-center">
						How it works
					</h2>
					<ol className="space-y-5">
						{config.howTo.map((step, i) => (
							<li key={i} className="flex gap-4">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold tabular-nums text-brand-700">
									{i + 1}
								</span>
								<div>
									<h3 className="font-semibold text-ink">{step.title}</h3>
									<p className="text-sm text-ink-muted mt-0.5">{step.body}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>

			<section className="px-4 sm:px-6 py-8 sm:py-10">
				<div className="max-w-3xl mx-auto">
					<h2 className="text-xl sm:text-2xl font-bold text-ink mb-6 text-center">
						FAQ
					</h2>
					<div className="border-t border-line">
						{config.faqs.map((faq, i) => (
							<details
								key={i}
								className="group border-b border-line py-4"
							>
								<summary className="cursor-pointer font-semibold text-ink list-none flex items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
									{faq.q}
									<ChevronDown className="h-5 w-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
								</summary>
								<p className="mt-2 text-sm text-ink-muted leading-relaxed">
									{faq.a}
								</p>
							</details>
						))}
					</div>
				</div>
			</section>

			<section className="px-4 sm:px-6 py-8 sm:py-10">
				<div className="max-w-3xl mx-auto text-center space-y-4">
					<h2 className="text-xl sm:text-2xl font-bold text-ink">
						{config.cta?.heading ?? "Need more than a quick calc?"}
					</h2>
					<p className="text-ink-muted text-sm sm:text-base">
						{config.cta?.body ??
							"Track multiple expenses, unequal splits, and ongoing groups in the full SplitBiller app — still no signup."}
					</p>
					<TrackedLink
						href="/dashboard"
						location="tool_page_footer"
						className="btn-primary !px-6 !py-3 !text-base"
					>
						{config.ctaLabel}
						<ArrowRight className="h-4 w-4" />
					</TrackedLink>
				</div>
			</section>

			<section className="px-4 sm:px-6 py-8 border-t border-line">
				<div className="max-w-3xl mx-auto">
					<h2 className="text-sm font-semibold text-gray-500 mb-3 text-center">
						Related tools
					</h2>
					<ul className="flex flex-wrap justify-center gap-2">
						{config.related.map((slug) => (
							<li key={slug}>
								<Link
									href={`/${slug}`}
									className="inline-block rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink-soft hover:text-brand-700 hover:border-line-strong"
								>
									{TOOL_PAGES[slug].title}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</section>

			<footer className="px-4 py-8 text-center text-xs text-gray-500">
				<Link href="/" className="inline-block py-2 text-indigo-600 hover:underline">
					SplitBiller
				</Link>
				{" · "}
				Free bill splitter · No login · Privacy-first
			</footer>
		</main>
	);
};
