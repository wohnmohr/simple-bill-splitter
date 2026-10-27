import { MetadataRoute } from "next";
import { ALL_TOOL_SLUGS } from "@/content/tools";
import { TEMPLATES } from "@/utils/payStory";
import { SITE_URL } from "@/lib/site";

// No lastmod, changefreq or priority: every build would stamp "now" on every page,
// and Google ignores lastmod it can't trust (and changefreq/priority entirely).
const PATHS = [
	"",
	"/tools",
	"/features",
	"/split",
	...[...TEMPLATES.map((t) => t.id), "by-item"].map((id) => `/split/${id}`),
	...ALL_TOOL_SLUGS.map((slug) => `/${slug}`),
	"/dashboard",
	"/roadmap",
	"/about",
	"/contact",
	"/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
	return PATHS.map((path) => ({ url: `${SITE_URL}${path}` }));
}
