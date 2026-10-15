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
				// Every response: no MIME sniffing, no framing (the pay and "Received" buttons
				// can't be clickjacked), only our origin in outgoing Referers, and no access
				// to device features the app never uses.
				source: "/:path*",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
				],
			},
			// Pages that scan order screenshots: cross-origin isolation lets the on-device
			// reader use several threads (about 2.5x faster). "credentialless" can't block
			// other sites' content, only drops cookies from it; Safari ignores it and the
			// scanner runs on one thread there.
			...["/dashboard", "/split-swiggy-zomato-bill"].map((source) => ({
				source,
				headers: [
					{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
					{ key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
				],
			})),
			{
				// The on-device OCR engine and models (copied in at build): large, and their
				// names change when they do (see scripts/copy-ocr-assets.mjs).
				source: "/ocr/:path*",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=2592000" },
					// The engine starts its threads as workers from here: inside an isolated
					// page, a worker script must carry the same embedder policy.
					{ key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
					{ key: "Cross-Origin-Resource-Policy", value: "same-origin" },
				],
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
