// SplitBiller's service worker: keeps the app opening when the phone is offline.
//
// Groups live in this browser's own storage, so the app works offline as long
// as its code is here. This caches only that code (hashed build files, fonts,
// images) and the /dashboard page itself. It never caches API responses, and it
// never caches shared /g, /s or /share pages, whose keys stay in the #fragment
// (which never reaches a service worker anyway).

const STATIC = "splitbiller-static-v1";
const PAGES = "splitbiller-pages-v1";
const STATIC_LIMIT = 150;
const APP_PAGE = "/dashboard";

/**
 * How a GET request is served, or null to leave it to the browser:
 * "static" cache-first (hashed build files never change), "asset" from cache
 * while refreshing it, "app" network-first falling back to the cached app page,
 * "page" network-first falling back to the offline page.
 */
function strategy(url, mode, destination) {
	if (url.origin !== self.location.origin) return null;
	if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ocr/")) return null;
	if (mode === "navigate") return url.pathname === APP_PAGE ? "app" : "page";
	if (url.pathname.startsWith("/_next/static/")) return "static";
	if (destination === "image" || destination === "font") return "asset";
	return null;
}

const OFFLINE_PAGE = `<!doctype html><html lang="en-IN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · SplitBiller</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f6f3;color:#1f1b24;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box">
<main><h1 style="font-size:1.25rem;margin:0 0 8px">You're offline</h1><p style="margin:0 0 20px;color:#5b5563">This page needs the internet. Your groups are still on this phone.</p>
<a href="${APP_PAGE}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#53307b;color:#fff;text-decoration:none;font-weight:600">Open your groups</a></main>`;

const offline = () => new Response(OFFLINE_PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });

async function trim(cache) {
	const keys = await cache.keys();
	await Promise.all(keys.slice(0, Math.max(0, keys.length - STATIC_LIMIT)).map((key) => cache.delete(key)));
}

async function fromCache(event, kind) {
	const cache = await caches.open(STATIC);
	const refresh = () =>
		fetch(event.request).then(async (response) => {
			if (response.ok) {
				await cache.put(event.request, response.clone());
				await trim(cache);
			}
			return response;
		});
	const hit = await cache.match(event.request);
	if (!hit) return refresh();
	if (kind === "asset") event.waitUntil(refresh().catch(() => {}));
	return hit;
}

async function networkFirst(event, kind) {
	try {
		const response = await fetch(event.request);
		if (kind === "app" && response.ok) {
			const copy = response.clone();
			event.waitUntil(caches.open(PAGES).then((cache) => cache.put(APP_PAGE, copy)));
		}
		return response;
	} catch {
		const cached = kind === "app" ? await caches.match(APP_PAGE) : undefined;
		return cached ?? offline();
	}
}

self.addEventListener("install", (event) => {
	// Take over at once; the cached app page is filled the first time it loads online.
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const keep = [STATIC, PAGES];
			const names = await caches.keys();
			await Promise.all(names.filter((name) => name.startsWith("splitbiller-") && !keep.includes(name)).map((name) => caches.delete(name)));
			await self.clients.claim();
		})()
	);
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;
	const kind = strategy(new URL(event.request.url), event.request.mode, event.request.destination);
	if (kind === "static" || kind === "asset") event.respondWith(fromCache(event, kind));
	else if (kind) event.respondWith(networkFirst(event, kind));
});
