// PostHog's ingest host, and the assets host it loads its recorder from.
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const posthogAssets = posthogHost.replace(".i.posthog.com", "-assets.i.posthog.com");
// The home page promo video may be hosted elsewhere (components/Landing/PromoVideo.tsx).
const promoVideoHost = process.env.NEXT_PUBLIC_PROMO_VIDEO_URL ? new URL(process.env.NEXT_PUBLIC_PROMO_VIDEO_URL, "https://splitbiller.com").origin : "";

// Scripts load only from our origin (and PostHog's recorder), and data goes only to
// our API and PostHog, so an injected script can't pull in more code or send the
// keys in localStorage elsewhere. 'unsafe-inline' is for the inline scripts Next
// writes into static pages; 'wasm-unsafe-eval' runs the OCR engine and libsodium.
// Dev adds 'unsafe-eval' for hot reload.
const contentSecurityPolicy = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${posthogAssets}${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval' https://va.vercel-scripts.com"}`,
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob: https://ph-files.imgix.net https://r2.direasy-multi-tenant.focusapps.app",
	`media-src 'self' blob: ${promoVideoHost}`.trim(),
	"font-src 'self'",
	`connect-src 'self' ${posthogHost} ${posthogAssets}`,
	"worker-src 'self' blob:",
	"frame-src https://tally.so",
	"manifest-src 'self'",
	"object-src 'none'",
	"base-uri 'none'",
	"form-action 'self'",
	"frame-ancestors 'none'",
].join("; ");

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
				// to device features the app never uses. The CSP also reaches the OCR worker
				// scripts, which take their policy from their own response.
				source: "/:path*",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "Content-Security-Policy", value: contentSecurityPolicy },
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
				// Built scripts, including the bootstrap the OCR worker starts from: inside an
				// isolated page, a worker script must carry the same embedder policy.
				source: "/_next/static/chunks/:path*",
				headers: [{ key: "Cross-Origin-Embedder-Policy", value: "credentialless" }],
			},
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
