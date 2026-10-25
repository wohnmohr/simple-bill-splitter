/**
 * Undo reverses only its own change. Anything done since (a new expense, a
 * comment, another device's edit) stays, so an Undo never loses an entry.
 *
 * Pure functions with only type imports, so they run in the browser and in node tests.
 */
import type { Group } from "@/types";
import { bringBack } from "@/utils/members";

/** Puts `item` back at `index` (or the end), unless it's already there. */
export const putBack = <T extends { id: string }>(list: T[], item: T, index: number): T[] =>
	list.some((x) => x.id === item.id) ? list : [...list.slice(0, index), item, ...list.slice(index)];

/** Undoes deleting an expense or payment: it goes back in its place, with its comments. */
export function undoDeleteExpense(group: Group, before: Group, expenseId: string): Group {
	const index = before.expenses.findIndex((e) => e.id === expenseId);
	if (index < 0) return group;
	const comments = (before.comments ?? []).reduce(
		(list, c, i) => (c.expenseId === expenseId ? putBack(list, c, i) : list),
		group.comments ?? []
	);
	return { ...group, expenses: putBack(group.expenses, before.expenses[index], index), ...(comments.length ? { comments } : {}) };
}

/** Undoes removing a member: brings them back if they were marked as left, or puts them back in their place. */
export function undoRemoveMember(group: Group, before: Group, personId: string): Group {
	const index = before.members.findIndex((m) => m.id === personId);
	const person = before.members[index];
	if (!person) return group;
	if (!group.members.some((m) => m.id === personId)) return { ...group, members: putBack(group.members, person, index) };
	return person.left ? group : bringBack(group, personId);
}
