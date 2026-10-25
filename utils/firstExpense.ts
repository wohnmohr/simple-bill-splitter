import { NEW_ME, type QuickResolved } from "@/utils/quickAdd";
import { cleanText, nameKey } from "@/utils/text";

/**
 * The names typed into "Who else?": split on commas, "and" or new lines, with
 * blanks, repeats and anyone in `taken` (you, or the group) dropped.
 */
export function splitNames(text: string, taken: string[] = []): string[] {
	const seen = new Set(taken.map(nameKey));
	const names: string[] = [];
	for (const part of text.split(/,|\band\b|&|\n/i)) {
		const name = cleanText(part, 40);
		if (!name || seen.has(nameKey(name))) continue;
		seen.add(nameKey(name));
		names.push(name);
	}
	return names;
}

/** A pasted list (one name per line, as copied from a chat or contacts) as one line: "Farah, Gopal, Hari". */
export const pastedNames = (text: string): string | null =>
	/\n/.test(text.trim()) ? text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).join(", ") : null;

/** What the first-run form asks: you paid, split equally with the others. */
export type FirstExpenseInput = { amount: number; description: string; myName: string; others: string[] };

/**
 * The first expense, written as a quick-add result so it saves exactly the way a
 * typed one does (applyQuickAdd): you paid, split equally with everyone named,
 * and you become the group's "me".
 */
export const firstExpense = ({ amount, description, myName, others }: FirstExpenseInput): QuickResolved => {
	const people = [
		{ key: NEW_ME, name: myName.trim(), isNew: true, isMe: true, unsure: false },
		...others.map((name, i) => ({ key: `new:${i}`, name, isNew: true, isMe: false, unsure: false })),
	];
	return {
		people,
		expenses: [{
			description: description.trim(),
			amount,
			paidBy: NEW_ME,
			participants: people.map((p) => p.key),
			splitMethod: "equally",
			monthly: false,
			unsure: [],
		}],
	};
};
