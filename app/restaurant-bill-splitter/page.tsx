import type { Metadata } from "next";
import { TOOL_PAGES } from "@/content/tools";
import { ToolPageLayout } from "@/components/Tools/ToolPageLayout";

const config = TOOL_PAGES["restaurant-bill-splitter"];

export const metadata: Metadata = {
	title: config.metaTitle,
	description: config.metaDescription,
	alternates: { canonical: `/${config.slug}` },
	openGraph: {
		title: config.metaTitle,
		description: config.metaDescription,
		url: `/${config.slug}`,
		siteName: "SplitBiller",
		type: "website",
	},
};

export default function Page() {
	return <ToolPageLayout config={config} />;
}
