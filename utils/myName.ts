import { NEW_ME, type QuickResolved } from "@/utils/quickAdd";

const KEY = "splitbiller-my-name";

/** Your own name, kept on this device only so forms can fill it in. Never synced or sent anywhere. */
export const loadMyName = (): string => {
	try {
		return localStorage.getItem(KEY) ?? "";
	} catch {
		return "";
	}
};

/** Remembers the name you typed where we asked for yours (not a name picked to join a group anonymously). */
export const rememberMyName = (name: string): void => {
	const trimmed = name.trim().slice(0, 40);
	if (!trimmed) return;
	try {
		localStorage.setItem(KEY, trimmed);
	} catch {
		/* storage unavailable: forms just ask again */
	}
};

/**
 * Fills in your name for the "you" that quick add couldn't name. Left blank when
 * the group already has someone by that name: that's for you to claim, not to add twice.
 */
export const withMyName = (quick: QuickResolved, name: string): QuickResolved => {
	const low = name.trim().toLowerCase();
	const me = quick.people.find((p) => p.key === NEW_ME);
	if (!low || !me || me.name || quick.people.some((p) => !p.isNew && p.name.toLowerCase() === low)) return quick;
	return { ...quick, people: quick.people.map((p) => (p === me ? { ...p, name: name.trim(), unsure: false } : p)) };
};
