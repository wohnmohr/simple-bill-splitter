/** @type {import('next').NextConfig} */
const nextConfig = {
	async headers() {
		return [
			{
				// The promo video and poster rarely change; let browsers and CDNs keep them for a week.
				source: "/promo/:path*",
				headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
			},
		];
	},
};

module.exports = nextConfig;
