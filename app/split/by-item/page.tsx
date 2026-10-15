import type { Metadata } from "next";
import { PageFrame } from "@/components/PayStory/PageFrame";
import { BillLinkApp } from "@/components/Scan/BillLinkApp";

const title = "Split a Restaurant Bill by Item: Friends Tap What They Ate";
const description =
	"Scan the bill and share one link. Each friend ticks what they ate, sees their exact share with tax and delivery included, and pays you by UPI. Free, no signup.";

export const metadata: Metadata = {
	title,
	description,
	alternates: { canonical: "/split/by-item" },
	openGraph: {
		title,
		description,
		url: "/split/by-item",
		siteName: "SplitBiller",
		type: "website",
		locale: "en_IN",
		images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SplitBiller" }],
	},
	twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

export default function BillByItemPage() {
	return (
		<PageFrame wide>
			<BillLinkApp />
		</PageFrame>
	);
}
