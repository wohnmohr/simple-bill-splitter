import type { Metadata } from "next";
import { TOOL_PAGES, ToolSlug } from "@/content/tools";

// A page's own `openGraph` replaces the root one, so the share image has to be
// repeated here or link previews (WhatsApp, X, LinkedIn) go without a card.
const SHARE_IMAGE = {
	url: "/opengraph-image",
	width: 1200,
	height: 630,
	alt: "SplitBiller — free bill splitter and UPI tools, no signup",
};

/** Metadata for a tool page: title, description, canonical, Open Graph and Twitter card. */
export function toolMetadata(slug: ToolSlug): Metadata {
	const { metaTitle: title, metaDescription: description } = TOOL_PAGES[slug];
	return {
		title,
		description,
		alternates: { canonical: `/${slug}` },
		openGraph: {
			title,
			description,
			url: `/${slug}`,
			siteName: "SplitBiller",
			type: "website",
			locale: "en_IN",
			images: [SHARE_IMAGE],
		},
		twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE.url] },
	};
}
