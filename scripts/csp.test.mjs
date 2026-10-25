// The Content-Security-Policy every response carries: scripts only from us (and
// PostHog's recorder), data only to our API and PostHog, no Tally script on our pages.
//   node --test --experimental-strip-types scripts/csp.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

async function policy(env = {}) {
	const saved = { ...process.env };
	Object.assign(process.env, { NODE_ENV: "production", NEXT_PUBLIC_POSTHOG_HOST: "", NEXT_PUBLIC_PROMO_VIDEO_URL: "" }, env);
	const require = createRequire(import.meta.url);
	const path = require.resolve("../next.config.js");
	delete require.cache[path];
	try {
		const rules = await require(path).headers();
		const csp = rules.find((r) => r.source === "/:path*").headers.find((h) => h.key === "Content-Security-Policy").value;
		return Object.fromEntries(csp.split("; ").map((d) => [d.split(" ")[0], d.split(" ").slice(1)]));
	} finally {
		process.env = saved;
	}
}

test("scripts run only from our origin and PostHog's assets host", async () => {
	const p = await policy();
	assert.deepEqual(p["script-src"], ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", "https://us-assets.i.posthog.com"]);
	assert.ok(!p["script-src"].some((s) => s.includes("tally")));
	assert.deepEqual(p["object-src"], ["'none'"]);
	assert.deepEqual(p["base-uri"], ["'none'"]);
});

test("data goes only to our API and PostHog", async () => {
	assert.deepEqual((await policy())["connect-src"], ["'self'", "https://us.i.posthog.com", "https://us-assets.i.posthog.com"]);
	assert.deepEqual((await policy({ NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com" }))["connect-src"], [
		"'self'",
		"https://eu.i.posthog.com",
		"https://eu-assets.i.posthog.com",
	]);
});

test("media plays from our origin, and from the promo video's host if it has one", async () => {
	assert.deepEqual((await policy())["media-src"], ["'self'", "blob:"]);
	const p = await policy({ NEXT_PUBLIC_PROMO_VIDEO_URL: "https://videos.example.com/promo.mp4" });
	assert.deepEqual(p["media-src"], ["'self'", "blob:", "https://videos.example.com"]);
});

test("the page can't be framed, and frames only Tally's forms", async () => {
	const p = await policy();
	assert.deepEqual(p["frame-ancestors"], ["'none'"]);
	assert.deepEqual(p["frame-src"], ["https://tally.so"]);
});

test("eval is allowed only in dev, for hot reload", async () => {
	assert.ok(!(await policy())["script-src"].includes("'unsafe-eval'"));
	assert.ok((await policy({ NODE_ENV: "development" }))["script-src"].includes("'unsafe-eval'"));
});
