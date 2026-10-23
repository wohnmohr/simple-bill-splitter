import type { Group } from "@/types";
import { MAX_GROUPS, STORAGE_KEY } from "@/constants";
import type { ShareSnapshot } from "@/types/share";
import { loadGroupsFromStorage, saveGroupsToStorage } from "@/utils/storage";
import { newId } from "@/utils/ids";

export type ImportResult =
	| { ok: true; groupId: string }
	| { ok: false; reason: "limit" | "empty" };

/** What to tell someone whose import hit MAX_GROUPS. */
export const IMPORT_LIMIT_MESSAGE = `You already have ${MAX_GROUPS} groups saved. Delete one in the app, then try again.`;

/**
 * Imports a shared snapshot into localStorage as a new group, and has the
 * dashboard open it next. `meId` says which member is on this device, when
 * that's already known. Does not send data to any server.
 */
/** Set once the "Send everyone their share" card is done with for a group. */
export const inviteNudgeKey = (groupId: string) => `splitbiller-invite-nudge-${groupId}`;

export function importShareSnapshot(snapshot: ShareSnapshot, meId?: string): ImportResult {
	if (!snapshot.members.length) {
		return { ok: false, reason: "empty" };
	}

	const existing = loadGroupsFromStorage();
	if (existing.length >= MAX_GROUPS) {
		return { ok: false, reason: "limit" };
	}

	const group: Group = {
		id: newId("group"),
		name: snapshot.name.slice(0, 60) || "Shared split",
		members: snapshot.members,
		expenses: snapshot.expenses.map((e, i) => ({
			...e,
			id: `exp-${Date.now()}-${i}`,
		})),
		currency: snapshot.currency,
		...(meId && snapshot.members.some((m) => m.id === meId) ? { meId } : {}),
	};

	saveGroupsToStorage([...existing, group]);
	// Someone else made this group and already sent it: "Send everyone their share" is theirs, not yours.
	try {
		window.localStorage.setItem(inviteNudgeKey(group.id), "imported");
	} catch {
		/* storage unavailable: the card shows and can be closed */
	}

	if (typeof window !== "undefined") {
		window.sessionStorage.setItem("splitbiller-select-group", group.id);
	}

	return { ok: true, groupId: group.id };
}

const SETTLE_KEY = "splitbiller-open-settle";

/** Has the dashboard open the next group on its settle-up tab (a payment reminder was tapped). */
export function openOnSettleUp(): void {
	try {
		window.sessionStorage.setItem(SETTLE_KEY, "1");
	} catch {
		/* it opens on the expenses tab instead */
	}
}

export function consumeOpenOnSettleUp(): boolean {
	try {
		const yes = window.sessionStorage.getItem(SETTLE_KEY) !== null;
		window.sessionStorage.removeItem(SETTLE_KEY);
		return yes;
	} catch {
		return false;
	}
}

export function consumePendingGroupSelection(): string | null {
	if (typeof window === "undefined") return null;
	// Tapping a group alert opens /dashboard#open=<this device's group id>.
	const opened = /^#open=([\w-]{1,64})$/.exec(window.location.hash)?.[1];
	if (opened) {
		window.history.replaceState(null, "", window.location.pathname);
		return opened;
	}
	const id = window.sessionStorage.getItem("splitbiller-select-group");
	if (id) {
		window.sessionStorage.removeItem("splitbiller-select-group");
	}
	return id;
}

export { STORAGE_KEY };
