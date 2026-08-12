import { MetadataRoute } from "next";
import { ALL_TOOL_SLUGS } from "@/content/tools";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl =
		process.env.NEXT_PUBLIC_SITE_URL || "https://splitbiller.com";

	const toolEntries: MetadataRoute.Sitemap = ALL_TOOL_SLUGS.map((slug) => ({
		url: `${baseUrl}/${slug}`,
		lastModified: new Date(),
		changeFrequency: "weekly",
		priority: 0.9,
	}));

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${baseUrl}/dashboard`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.7,
		},
		...toolEntries,
	];
}
