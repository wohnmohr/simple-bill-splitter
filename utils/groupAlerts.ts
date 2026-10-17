/**
 * Opt-in alerts when someone else changes a synced group, per group and per
 * device. The server keeps this device's push address next to the group's
 * lookup id, nothing more; alerts carry only that id, and the service worker
 * (public/sw.js) finds the name in this device's own list below.
 */
import type { Group } from "@/types";
import { api } from "@/utils/groupApi";
import { deriveGroupKeys } from "@/utils/groupVault";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const DB = "splitbiller-alerts";
const STORE = "groups";

/** What the service worker needs to show an alert: the group's name, and which group to open. */
type Watched = { name: string; localId: string };

export const alertsSupported = () =>
	Boolean(PUBLIC_KEY) && typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function store<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		const open = indexedDB.open(DB, 1);
		open.onupgradeneeded = () => open.result.createObjectStore(STORE);
		open.onerror = () => reject(open.error);
		open.onsuccess = () => {
			const req = run(open.result.transaction(STORE, mode).objectStore(STORE));
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		};
	});
}

const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** This device's push subscription, created on first use. */
async function subscription(create: boolean): Promise<PushSubscription | null> {
	const reg = await navigator.serviceWorker.register("/sw.js");
	const existing = await reg.pushManager.getSubscription();
	if (existing || !create) return existing;
	return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromB64u(PUBLIC_KEY!) });
}

export async function alertsOn(group: Group): Promise<boolean> {
	if (!alertsSupported() || !group.sync || Notification.permission !== "granted") return false;
	const { id } = await deriveGroupKeys(group.sync.secret, group.sync.pass);
	return Boolean(await store<Watched | undefined>("readonly", (s) => s.get(id)).catch(() => undefined));
}

/** Asks for permission if needed, then signs this device up for the group's alerts. False if the person said no. */
export async function enableAlerts(group: Group): Promise<boolean> {
	if (!group.sync) return false;
	if ((await Notification.requestPermission()) !== "granted") return false;
	const keys = await deriveGroupKeys(group.sync.secret, group.sync.pass);
	const sub = await subscription(true);
	await api("/alerts", { id: keys.id, token: keys.token, sub: sub!.toJSON(), on: true });
	await store("readwrite", (s) => s.put({ name: group.name, localId: group.id } satisfies Watched, keys.id));
	return true;
}

export async function disableAlerts(group: Group): Promise<void> {
	if (!group.sync || !alertsSupported()) return;
	const keys = await deriveGroupKeys(group.sync.secret, group.sync.pass);
	await store("readwrite", (s) => s.delete(keys.id)).catch(() => undefined);
	const sub = await subscription(false);
	if (sub) await api("/alerts", { id: keys.id, token: keys.token, sub: sub.toJSON(), on: false });
}

let ownTag: Promise<string | undefined> | null = null;
/**
 * The hash of this device's push address, sent with its own changes so the
 * server doesn't alert it about them. Undefined when it has no alerts.
 */
export function quietTag(): Promise<string | undefined> {
	if (!alertsSupported() || Notification.permission !== "granted") return Promise.resolve(undefined);
	return (ownTag ??= navigator.serviceWorker
		.getRegistration("/")
		.then((reg) => reg?.pushManager.getSubscription())
		.then(async (sub) => {
			if (!sub) return undefined;
			const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sub.endpoint));
			return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
		})
		.catch(() => undefined));
}
