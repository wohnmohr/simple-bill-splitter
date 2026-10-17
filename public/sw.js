// SplitBiller's service worker. It only shows alerts for synced groups the
// person asked to hear about (utils/groupAlerts.ts); it caches nothing.
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
			if (open) return open.focus();
			return self.clients.openWindow(localId ? `/dashboard#open=${encodeURIComponent(localId)}` : "/dashboard");
		})()
	);
});
