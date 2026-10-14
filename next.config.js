/** @type {import('next').NextConfig} */
const nextConfig = {
	poweredByHeader: false,
	async headers() {
		return [
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
