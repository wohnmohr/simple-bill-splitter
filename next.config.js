/** @type {import('next').NextConfig} */
const nextConfig = {
	poweredByHeader: false,
	async redirects() {
		// Addresses people type when looking for who's behind the site.
		return [
			{ source: "/contact-us", destination: "/contact", permanent: true },
			{ source: "/about-us", destination: "/about", permanent: true },
			// Feature requests moved onto the roadmap.
			{ source: "/feature-requests", destination: "/roadmap#request", permanent: true },
		];
	},
	async headers() {
		return [
			{
				// The on-device OCR engine and model (copied in at build): large, and only
				// change with a tesseract.js upgrade.
				source: "/ocr/:path*",
				headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=2592000" }],
			},
			{
				// The promo poster rarely changes; let browsers and CDNs keep it for a week.
				source: "/promo/:path*",
				headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
			},
			{
				// Unhashed static images, icons and feature clips: a day fresh, then served stale while revalidating.
				source: "/:all*(png|jpg|jpeg|webp|svg|ico|mp4)",
				headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
			},
		];
	},
};

module.exports = nextConfig;
