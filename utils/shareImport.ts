import { Group } from "@/types";
import { MAX_GROUPS, STORAGE_KEY } from "@/constants";
import { ShareSnapshot } from "@/types/share";
import { loadGroupsFromStorage, saveGroupsToStorage } from "@/utils/storage";

export type ImportResult =
	| { ok: true; groupId: string }
	| { ok: false; reason: "limit" | "empty" };

/**
 * Imports a shared snapshot into localStorage as a new group.
 * Does not send data to any server.
 */
export function importShareSnapshot(snapshot: ShareSnapshot): ImportResult {
	if (!snapshot.members.length) {
		return { ok: false, reason: "empty" };
	}

	const existing = loadGroupsFromStorage();
	if (existing.length >= MAX_GROUPS) {
		return { ok: false, reason: "limit" };
	}

	const group: Group = {
		id: `group-${Date.now()}`,
		name: snapshot.name.slice(0, 60) || "Shared split",
		members: snapshot.members,
		expenses: snapshot.expenses.map((e, i) => ({
			...e,
			id: `exp-${Date.now()}-${i}`,
		})),
		currency: snapshot.currency,
	};

	saveGroupsToStorage([...existing, group]);

	if (typeof window !== "undefined") {
		window.sessionStorage.setItem("splitbiller-select-group", group.id);
	}

	return { ok: true, groupId: group.id };
}

export function consumePendingGroupSelection(): string | null {
	if (typeof window === "undefined") return null;
	const id = window.sessionStorage.getItem("splitbiller-select-group");
	if (id) {
		window.sessionStorage.removeItem("splitbiller-select-group");
	}
	return id;
}

export { STORAGE_KEY };
