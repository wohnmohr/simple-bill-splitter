import type { Metadata } from "next";
import { PageFrame } from "@/components/PayStory/PageFrame";
import { TemplateGrid } from "@/components/PayStory/TemplateGrid";

const title = "Split Anything and Share One UPI Link";
const description =
	"Pick what you are splitting: dinner, rent, groceries, a trip, a gift. Get a shareable link where friends pay you by UPI and you see who has paid. Free, no signup.";

export const metadata: Metadata = {
	title,
	description,
	alternates: { canonical: "/split" },
	openGraph: {
		title,
		description,
		url: "/split",
		siteName: "SplitBiller",
		type: "website",
		locale: "en_IN",
		images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SplitBiller" }],
	},
	twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

export default function SplitHubPage() {
	return (
		<PageFrame wide>
			<div className="mx-auto w-full max-w-5xl min-w-0 px-4 py-10 sm:py-14">
				<h1 className="font-display text-3xl font-semibold text-ink [text-wrap:balance] sm:text-5xl">
					What are you splitting?
				</h1>
				<p className="mt-3 max-w-2xl text-ink-soft sm:text-lg">
					Every split has its own page with sensible defaults. Fill in the amount, share one link, and friends pay you directly
					through UPI. Payments update live for everyone with the link. No signup, and every split is end-to-end
					encrypted: the key stays in your link, so not even SplitBiller can read it. Splits are deleted automatically after
					30 days.
				</p>
				<div className="mt-8">
					<TemplateGrid />
				</div>
			</div>
		</PageFrame>
	);
}
