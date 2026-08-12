import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { ToolPageConfig, TOOL_PAGES } from "@/content/tools";
import { Button } from "@/components/UI/Button";
import { ToolCalculator } from "@/components/Tools/ToolCalculator";

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
		applicationCategory: "FinanceApplication",
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
		<main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-900">
			<ToolJsonLd config={config} />

			<header className="px-4 sm:px-6 pt-5 pb-2">
				<div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
					<Link href="/" className="flex items-center gap-2 group">
						<img
							src="/logo.png"
							alt="SplitBiller"
							className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
						/>
						<span className="font-bold text-base sm:text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
							SplitBiller
						</span>
					</Link>
					<Link href="/dashboard">
						<Button variant="primary" size="sm">
							Open app
						</Button>
					</Link>
				</div>
			</header>

			<section className="px-4 sm:px-6 pt-6 sm:pt-10 pb-8">
				<div className="max-w-5xl mx-auto text-center space-y-3 sm:space-y-4">
					<p className="text-sm font-semibold text-indigo-600">{config.title}</p>
					<h1 className="text-[clamp(1.5rem,4.5vw,2.75rem)] font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
						{config.headline}
					</h1>
					<p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
						{config.subhead}
					</p>
					<p className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full">
						<Lock className="h-3.5 w-3.5" />
						Share links encrypt in your browser — we never store the split
					</p>
				</div>
			</section>

			<section className="px-4 sm:px-6 pb-10 sm:pb-14">
				<div className="max-w-5xl mx-auto">
					<ToolCalculator kind={config.calculator} />
				</div>
			</section>

			<section className="px-4 sm:px-6 py-8 sm:py-10">
				<div className="max-w-3xl mx-auto space-y-4">
					{config.intro.map((p, i) => (
						<p key={i} className="text-base text-gray-700 leading-relaxed">
							{p}
						</p>
					))}
				</div>
			</section>

			<section className="px-4 sm:px-6 py-8 sm:py-10 bg-white/40">
				<div className="max-w-3xl mx-auto">
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">
						How it works
					</h2>
					<ol className="space-y-5">
						{config.howTo.map((step, i) => (
							<li key={i} className="flex gap-4">
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-bold text-white">
									{i + 1}
								</span>
								<div>
									<h3 className="font-semibold text-gray-900">{step.title}</h3>
									<p className="text-sm text-gray-600 mt-0.5">{step.body}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>

			<section className="px-4 sm:px-6 py-8 sm:py-10">
				<div className="max-w-3xl mx-auto">
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">
						FAQ
					</h2>
					<div className="space-y-4">
						{config.faqs.map((faq, i) => (
							<details
								key={i}
								className="group rounded-xl bg-white/80 border border-white/60 px-4 py-3 open:shadow-md"
							>
								<summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between gap-2">
									{faq.q}
									<span className="text-indigo-500 group-open:rotate-45 transition-transform">
										+
									</span>
								</summary>
								<p className="mt-2 text-sm text-gray-600 leading-relaxed">
									{faq.a}
								</p>
							</details>
						))}
					</div>
				</div>
			</section>

			<section className="px-4 sm:px-6 py-8 sm:py-10">
				<div className="max-w-3xl mx-auto text-center space-y-4">
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900">
						Need more than a quick calc?
					</h2>
					<p className="text-gray-600 text-sm sm:text-base">
						Track multiple expenses, unequal splits, and ongoing groups in the
						full SplitBiller app — still no signup.
					</p>
					<Link href="/dashboard">
						<Button variant="primary" size="lg">
							<span className="inline-flex items-center gap-2">
								{config.ctaLabel}
								<ArrowRight className="h-5 w-5 !text-white" />
							</span>
						</Button>
					</Link>
				</div>
			</section>

			<section className="px-4 sm:px-6 py-8 border-t border-indigo-100/80">
				<div className="max-w-3xl mx-auto">
					<h2 className="text-sm font-semibold text-gray-500 mb-3 text-center">
						Related tools
					</h2>
					<ul className="flex flex-wrap justify-center gap-2">
						{config.related.map((slug) => (
							<li key={slug}>
								<Link
									href={`/${slug}`}
									className="inline-block rounded-lg bg-white/80 border border-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
								>
									{TOOL_PAGES[slug].title}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</section>

			<footer className="px-4 py-8 text-center text-xs text-gray-500">
				<Link href="/" className="text-indigo-600 hover:underline">
					SplitBiller
				</Link>
				{" · "}
				Free bill splitter · No login · Privacy-first
			</footer>
		</main>
	);
};
