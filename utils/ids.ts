/**
 * A new id for a group, member or expense. Random, not just a timestamp, so two
 * phones adding something in the same millisecond to a synced group never
 * overwrite each other.
 */
export const newId = (prefix: string) => {
	const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(36).padStart(2, "0")).join("");
	return `${prefix}-${Date.now().toString(36)}${rand}`;
};
