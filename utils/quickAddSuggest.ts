/**
 * What to offer next while someone types a quick-add sentence: the rest of a
 * name they started, people after "with" or "paid by", or the usual next step
 * after an amount. Pure and on-device, like the parser it feeds.
 */

export type QuickSuggestion = { label: string; text: string };

/** Words after which someone's name comes next. */
const NAME_NEXT = /\b(?:with|between|among|for|by|and|&|n)$/i;
const AFTER_AMOUNT = ["split with", "paid by", "monthly"];

/**
 * Up to three suggestions for the end of `text`. Each one's `text` is the
 * whole new input, so applying it is one assignment.
 */
export function suggestQuickAdd(text: string, memberNames: string[]): QuickSuggestion[] {
	const people = ["me", ...memberNames.filter((n) => n.trim() && n.toLowerCase() !== "me")];
	const typed = new Set(text.toLowerCase().match(/\p{L}+/gu) ?? []);
	const unused = people.filter((n) => !typed.has(n.toLowerCase().split(/\s+/)[0]));
	const add = (base: string, words: string[]) => words.map((w) => ({ label: w, text: `${base}${w} ` }));

	// Finishing a word: "split with as" → "Asha"
	const partial = text.match(/(?:^|\s)(\p{L}{2,})$/u);
	if (partial) {
		const start = text.length - partial[1].length;
		const before = text.slice(0, start).trimEnd();
		if (!NAME_NEXT.test(before)) return [];
		const low = partial[1].toLowerCase();
		const names = unused.filter((n) => n.toLowerCase().startsWith(low) && n.toLowerCase() !== low);
		return add(text.slice(0, start), names.slice(0, 3));
	}

	if (!/\s$/.test(text)) return [];
	const last = text.trimEnd();
	if (NAME_NEXT.test(last)) {
		const everyone = /\b(?:with|between|among|for)$/i.test(last) ? ["everyone"] : [];
		return add(text, [...unused, ...everyone].slice(0, 3));
	}
	// Right after an amount: "Dinner 2400 "
	if (/\d(?:k|l|lakh)?$/i.test(last) && !/\b(?:with|between|paid|split|ways)\b/i.test(last)) return add(text, AFTER_AMOUNT);
	return [];
}

/**
 * Whole sentences to start from, one per common kind, using the group's own
 * names when it has them.
 */
export function quickAddTemplates(memberNames: string[]): QuickSuggestion[] {
	const [a = "Asha", b = "Ben"] = memberNames.map((n) => n.trim().split(/\s+/)[0]).filter(Boolean);
	const trip = memberNames.length ? [] : [{ label: "Trip", text: `Goa trip: ${a} 5000 hotel, ${b} 1200 fuel, everyone equal` }];
	return [
		...trip,
		{ label: "Split equally", text: `Dinner 2400 split with ${a} and ${b}` },
		{ label: "Someone paid", text: `${a} paid 900 for the cab` },
		{ label: "Exact shares", text: `Groceries 1500: ${a} 1000, me 500` },
		{ label: "Monthly", text: "Rent 30k monthly split 3 ways" },
		{ label: "Owes me", text: `${a} owes me 500 for lunch` },
	];
}
