import type { Metadata } from "next";
import { LandingPage } from "@/components/Landing/LandingPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Tells Google the site's name (shown above the result) and that the app is free.
const jsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{ "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "SplitBiller", url: SITE_URL, inLanguage: "en-IN" },
		{ "@type": "Organization", "@id": `${SITE_URL}/#org`, name: "SplitBiller", url: SITE_URL, logo: `${SITE_URL}/web-app-manifest-512x512.png` },
		{
			"@type": "WebApplication",
			name: "SplitBiller",
			url: `${SITE_URL}/dashboard`,
			applicationCategory: "FinanceApplication",
			operatingSystem: "Any",
			offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
			publisher: { "@id": `${SITE_URL}/#org` },
		},
	],
};

export default function Landing() {
	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<LandingPage />
		</>
	);
}
