import { MetadataRoute } from "next";
import { ALL_TOOL_SLUGS } from "@/content/tools";
import { TEMPLATES } from "@/utils/payStory";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = SITE_URL;

	const toolEntries: MetadataRoute.Sitemap = ALL_TOOL_SLUGS.map((slug) => ({
		url: `${baseUrl}/${slug}`,
		lastModified: new Date(),
		changeFrequency: "weekly",
		priority: 0.9,
	}));

	const splitEntries: MetadataRoute.Sitemap = [...TEMPLATES.map((t) => t.id), "by-item"].map((id) => ({
		url: `${baseUrl}/split/${id}`,
		lastModified: new Date(),
		changeFrequency: "monthly",
		priority: 0.8,
	}));

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${baseUrl}/tools`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/features`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		...["about", "contact"].map((page) => ({
			url: `${baseUrl}/${page}`,
			lastModified: new Date(),
			changeFrequency: "yearly" as const,
			priority: 0.5,
		})),
		{
			url: `${baseUrl}/dashboard`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/roadmap`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.4,
		},
		{
			url: `${baseUrl}/split`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		...splitEntries,
		...toolEntries,
	];
}
