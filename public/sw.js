// SplitBiller's service worker. It shows alerts for synced groups the person
// asked to hear about (utils/groupAlerts.ts), and holds a screenshot shared
// into the installed app until the app reads it (utils/launch.ts). It caches
// nothing else.
//
// An alert carries just the group's lookup id. The group's name comes from this
// device's own list, so no name ever travels through a push service.

const DB = "splitbiller-alerts";
const STORE = "groups";

const lookup = (id) =>
	new Promise((resolve) => {
		const open = indexedDB.open(DB, 1);
		open.onupgradeneeded = () => open.result.createObjectStore(STORE);
		open.onerror = () => resolve(undefined);
		open.onsuccess = () => {
			const get = open.result.transaction(STORE).objectStore(STORE).get(id);
			get.onsuccess = () => resolve(get.result);
			get.onerror = () => resolve(undefined);
		};
	});

self.addEventListener("push", (event) => {
	event.waitUntil(
		(async () => {
			let id = "";
			try {
				id = String(event.data?.json().g ?? "");
			} catch {
				/* not one of ours: still show something, as browsers require */
			}
			const group = id ? await lookup(id) : undefined;
			await self.registration.showNotification(group?.name ?? "SplitBiller", {
				body: group ? "Someone added or changed an expense. Tap to see." : "One of your groups changed. Tap to see.",
				icon: "/web-app-manifest-192x192.png",
				badge: "/web-app-manifest-192x192.png",
				tag: id || "splitbiller",
				data: { localId: group?.localId },
			});
		})()
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const localId = event.notification.data?.localId;
	event.waitUntil(
		(async () => {
			const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
			const open = windows.find((w) => new URL(w.url).pathname === "/dashboard");
			if (open) {
				// The app is already open: it switches to the group itself (hooks/useGroups.ts).
				if (localId) open.postMessage({ open: localId });
				return open.focus();
			}
			return self.clients.openWindow(localId ? `/dashboard#open=${encodeURIComponent(localId)}` : "/dashboard");
		})()
	);
});

// Share a bill screenshot into the installed app (manifest share_target): keep
// the image on this device for the app to scan, then open Add expense.
self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== "POST" || url.pathname !== "/share-target") return;
	event.respondWith(
		(async () => {
			try {
				const file = (await event.request.formData()).get("bill");
				// Only a screenshot: anything else is no bill, and could fill the phone's storage.
				if (file instanceof File && file.type.startsWith("image/") && file.size <= 20 * 1024 * 1024) {
					const cache = await caches.open("splitbiller-shared");
					await cache.put("/shared-bill", new Response(file, { headers: { "content-type": file.type } }));
				}
			} catch {
				/* nothing usable shared: Add expense still opens */
			}
			return Response.redirect("/dashboard?shared", 303);
		})()
	);
});
