import type { Expense } from "@/types";

/**
 * A new id for a group, member or expense. Random, not just a timestamp, so two
 * phones adding something in the same millisecond to a synced group never
 * overwrite each other.
 */
export const newId = (prefix: string) => {
	const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(36).padStart(2, "0")).join("");
	return `${prefix}-${Date.now().toString(36)}${rand}`;
};

/**
 * The id for marking a suggested payment paid. It's the same on every phone that
 * sees the same debt, so when both people mark it (Ben "paid", Asha "received")
 * before their phones sync, the group keeps one payment, not two. It covers the
 * payments already made between the two, so a later payment gets a new id.
 */
export const paymentId = (expenses: Expense[], from: string, to: string, amount: number) => {
	const between = (e: Expense) =>
		e.kind === "payment" && ((e.paidBy === from && e.participants[0] === to) || (e.paidBy === to && e.participants[0] === from));
	const key = JSON.stringify([from, to, Math.round(amount * 100), expenses.filter(between).map((e) => e.id).sort()]);
	// cyrb53: a quick 53-bit hash, plenty to keep different payments apart.
	let h1 = 0xdeadbeef;
	let h2 = 0x41c6ce57;
	for (let i = 0; i < key.length; i++) {
		h1 = Math.imul(h1 ^ key.charCodeAt(i), 2654435761);
		h2 = Math.imul(h2 ^ key.charCodeAt(i), 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
	return `payment-${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)}`;
};
