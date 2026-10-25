import type { Group } from "@/types";
import { currentMembers } from "@/utils/members";

/** Where a home-screen shortcut or a shared screenshot lands: /dashboard?add or /dashboard?shared. */
export type Launch = "add" | "shared";

const SHARED_CACHE = "splitbiller-shared";
const SHARED_BILL = "/shared-bill";

/** Reads how the app was opened, once: the query is cleared so a reload doesn't repeat it. */
export function takeLaunch(): Launch | null {
	const params = new URLSearchParams(window.location.search);
	const launch = params.has("shared") ? "shared" : params.has("add") ? "add" : null;
	if (launch) window.history.replaceState(null, "", window.location.pathname + window.location.hash);
	return launch;
}

/** The screenshot shared into the app, which the service worker held for it (public/sw.js). Read once, then gone. */
export async function takeSharedBill(): Promise<File | null> {
	try {
		const cache = await caches.open(SHARED_CACHE);
		const res = await cache.match(SHARED_BILL);
		await caches.delete(SHARED_CACHE);
		if (!res) return null;
		const blob = await res.blob();
		return new File([blob], "shared-bill", { type: blob.type });
	} catch {
		return null;
	}
}

/** The open group you used last, among those with people to add an expense for: the one with the newest expense, else the newest group. */
export function latestGroup(groups: Group[]): Group | undefined {
	let best: Group | undefined;
	let bestAt = -1;
	for (const g of groups) {
		if (g.closedAt || currentMembers(g.members).length === 0) continue;
		const at = Math.max(0, ...g.expenses.map((e) => e.createdAt ?? 0));
		// Ties (no dates yet) go to the later group in the list, which is the newer one.
		if (at >= bestAt) [best, bestAt] = [g, at];
	}
	return best;
}
