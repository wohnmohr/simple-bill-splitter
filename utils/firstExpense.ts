import { NEW_ME, type QuickResolved } from "@/utils/quickAdd";

/** The names typed into "Who else?": split on commas or "and", blanks and repeats (and you) dropped. */
export function splitNames(text: string, myName = ""): string[] {
	const seen = new Set([myName.trim().toLowerCase()]);
	const names: string[] = [];
	for (const part of text.split(/,|\band\b|&/i)) {
		const name = part.trim().replace(/\s+/g, " ");
		if (!name || seen.has(name.toLowerCase())) continue;
		seen.add(name.toLowerCase());
		names.push(name.slice(0, 40));
	}
	return names;
}

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
