/**
 * Removing people without losing what happened. Expenses are the group's
 * record, so someone who paid for or shared anything stays on those entries
 * (and in balances) after they're removed: they're only marked as left, which
 * keeps them out of new expenses. Someone on no entry is removed outright,
 * except in a shared group: another phone may be adding an entry for them
 * right now, so there they're always only marked as left.
 *
 * Pure functions with only type imports, so they run in the browser and in node tests.
 */
import type { Expense, Group, Person } from "@/types";
import { expensePayers } from "@/utils/calculations";

/** Whether this person paid for or shares the entry. */
export const isOnEntry = (e: Expense, personId: string) => expensePayers(e).has(personId) || e.participants.includes(personId);

/** How many entries this person is on. */
export const entriesWith = (expenses: Expense[], personId: string) => expenses.filter((e) => isOnEntry(e, personId)).length;

/** Who new expenses can include: everyone who hasn't left. */
export const currentMembers = (people: Person[]) => people.filter((p) => !p.left);

/** Removes a member, keeping anyone on past entries as left so no entry is lost. */
export function removeMember(group: Group, personId: string): Group {
	const members = group.sync || entriesWith(group.expenses, personId)
		? group.members.map((m) => (m.id === personId ? { ...m, left: true as const } : m))
		: group.members.filter((m) => m.id !== personId);
	return { ...group, members };
}

/** Brings someone who left back, so they can be on new expenses again. */
export const bringBack = (group: Group, personId: string): Group => ({
	...group,
	members: group.members.map((m) => {
		if (m.id !== personId) return m;
		const { left: _left, ...back } = m;
		return back;
	}),
});
