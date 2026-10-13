/**
 * Remembers, on this device only, which split links were made here, so their
 * organiser can mark friends as paid. Never sent anywhere.
 */
const MINE_KEY = "splitbiller-my-splits";
/** Link-only splits all live at /pay-story, so they're flagged for the next open only. */
const NEXT_OPEN_KEY = "splitbiller-created-split";
/** Cloud splits are deleted after 30 days, so a short list covers everything still live. */
const MAX_REMEMBERED = 50;

const isCloudPath = (path: string) => path.startsWith("/s/");

const readMine = (): string[] => {
	try {
		const list = JSON.parse(localStorage.getItem(MINE_KEY) || "[]");
		return Array.isArray(list) ? list.filter((p): p is string => typeof p === "string") : [];
	} catch {
		return [];
	}
};

/** Call when a split is created, with its path (never the #key). */
export function rememberOrganiser(path: string): void {
	try {
		if (isCloudPath(path)) {
			localStorage.setItem(MINE_KEY, JSON.stringify([path, ...readMine().filter((p) => p !== path)].slice(0, MAX_REMEMBERED)));
		} else {
			sessionStorage.setItem(NEXT_OPEN_KEY, path);
		}
	} catch {
		/* storage blocked: they'll see the payer view */
	}
}

/** True if the split at `path` was made on this device. */
export function isOrganiser(path: string): boolean {
	if (isCloudPath(path)) return readMine().includes(path);
	try {
		if (sessionStorage.getItem(NEXT_OPEN_KEY) !== path) return false;
		sessionStorage.removeItem(NEXT_OPEN_KEY);
		return true;
	} catch {
		return false;
	}
}
