import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/PayStory/PageFrame";
import { SplitStudio } from "@/components/PayStory/SplitStudio";
import { TemplateGrid, themeGradient } from "@/components/PayStory/TemplateGrid";
import { TEMPLATES, findTemplate } from "@/utils/payStory";

export const dynamicParams = false;

export const generateStaticParams = () => TEMPLATES.map((t) => ({ template: t.id }));

const SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "SplitBiller — free bill splitter and UPI tools, no signup" };

export async function generateMetadata({ params }: { params: Promise<{ template: string }> }): Promise<Metadata> {
	const t = findTemplate((await params).template);
	if (!t) return {};
	const url = `/split/${t.id}`;
	return {
		title: t.seoTitle,
		description: t.seoDescription,
		alternates: { canonical: url },
		openGraph: { title: t.seoTitle, description: t.seoDescription, url, siteName: "SplitBiller", type: "website", locale: "en_IN", images: [SHARE_IMAGE] },
		twitter: { card: "summary_large_image", title: t.seoTitle, description: t.seoDescription, images: [SHARE_IMAGE.url] },
	};
}

const STEPS = [
	["Set the amount", "Enter the total and how many people share it, or let each person choose."],
	["Share one link", "Send it in your group chat. The split and your UPI ID live inside the link."],
	["Friends pay by UPI", "They tap pay, the money comes straight to you, and the progress bar fills up."],
];

export default async function SplitTemplatePage({ params }: { params: Promise<{ template: string }> }) {
	const t = findTemplate((await params).template);
	if (!t) notFound();
	const fg = t.theme.darkText ? "#1c1826" : "#ffffff";

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: t.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
	};

	return (
		<PageFrame>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<section className="px-4 pb-24 pt-8 sm:pb-28 sm:pt-12" style={{ background: themeGradient(t), color: fg }}>
				<div className="mx-auto max-w-3xl">
					<nav aria-label="Breadcrumb" className="mb-4 text-sm opacity-80">
						<Link href="/split" className="underline-offset-2 hover:underline">Splits</Link> / {t.label}
					</nav>
					<p aria-hidden className="text-5xl">{t.emoji}</p>
					<h1 className="mt-2 font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
					<p className="mt-3 max-w-xl text-base opacity-90 sm:text-lg">{t.sub}</p>
				</div>
			</section>

			<div className="mx-auto -mt-16 w-full max-w-3xl min-w-0 px-4 sm:-mt-20">
				<SplitStudio template={t} />
			</div>

			<div className="mx-auto w-full max-w-3xl min-w-0 space-y-12 px-4 py-12">
				<section>
					<h2 className="font-display text-2xl font-semibold text-ink">How it works</h2>
					<ol className="mt-4 grid gap-3 sm:grid-cols-3">
						{STEPS.map(([h, b], i) => (
							<li key={h} className="rounded-xl border border-line bg-white p-4">
								<span
									className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold"
									style={{ background: themeGradient(t), color: fg }}
								>
									{i + 1}
								</span>
								<p className="mt-2 font-semibold text-ink">{h}</p>
								<p className="mt-1 text-sm text-ink-soft">{b}</p>
							</li>
						))}
					</ol>
				</section>

				<section>
					<h2 className="font-display text-2xl font-semibold text-ink">Tips for {t.label.toLowerCase()}</h2>
					<ul className="mt-4 space-y-3">
						{t.tips.map((tip) => (
							<li key={tip} className="flex gap-3 text-ink-soft">
								<span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.theme.from }} />
								{tip}
							</li>
						))}
					</ul>
				</section>

				<section>
					<h2 className="font-display text-2xl font-semibold text-ink">Questions</h2>
					<div className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
						{t.faqs.map((f) => (
							<details key={f.q} className="group p-4">
								<summary className="cursor-pointer font-semibold text-ink">{f.q}</summary>
								<p className="mt-2 text-sm text-ink-soft">{f.a}</p>
							</details>
						))}
					</div>
				</section>

				<section>
					<h2 className="font-display text-2xl font-semibold text-ink">Splitting something else?</h2>
					<div className="mt-4">
						<TemplateGrid exclude={t.id} />
					</div>
				</section>
			</div>
		</PageFrame>
	);
}
