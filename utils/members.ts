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

/**
 * Removes a member, keeping anyone on past entries as left so no entry is lost.
 * Removing yourself clears "you", so who you are is asked again.
 */
export function removeMember(group: Group, personId: string): Group {
	const members = group.sync || entriesWith(group.expenses, personId)
		? group.members.map((m) => (m.id === personId ? { ...m, left: true as const } : m))
		: group.members.filter((m) => m.id !== personId);
	return { ...group, members, ...(personId === group.meId ? { meId: undefined } : {}) };
}

const isCurrent = (group: Group, personId: Group["meId"]) => currentMembers(group.members).some((m) => m.id === personId);

/** "You" after another device's edits: cleared if they removed you, so who you are is asked again. */
export const meAfter = (before: Group, after: Group): Group["meId"] =>
	isCurrent(before, before.meId) && !isCurrent(after, before.meId) ? undefined : before.meId;

/** Brings someone who left back, so they can be on new expenses again. */
export const bringBack = (group: Group, personId: string): Group => ({
	...group,
	members: group.members.map((m) => {
		if (m.id !== personId) return m;
		const { left: _left, ...back } = m;
		return back;
	}),
});

/** Who shared the group. Groups shared before hosts were recorded fall back to the first person added, usually whoever made it. */
export const hostOf = (group: Group): string | undefined => group.hostId ?? group.members[0]?.id;

/**
 * Whether this device may set a member's UPI ID (or, with no id, a new member's).
 * In a shared group only that person or the device that shared it can, so no
 * one can slip their own UPI ID under a friend's name. A group on this device
 * alone is all yours.
 */
export const canSetUpi = (group: Group, personId?: string): boolean =>
	!group.sync || group.hosted === true || (!!group.meId && group.meId === personId);

/**
 * Marks whether this device shared the group, for groups saved before that was
 * kept: it did if its "you" is the host. Settled once, so choosing the host as
 * "you" later doesn't make a phone the host.
 */
export const withHosted = (group: Group): Group =>
	!group.sync || group.hosted !== undefined ? group : { ...group, hosted: !!group.meId && group.meId === hostOf(group) };

/** How long Settle up points out a payee's changed UPI ID. */
const UPI_CHANGE_SHOWN_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * When another device changed (or removed) someone's UPI ID, the time this
 * device saw it, so Settle up can say so before anyone pays the new one.
 * `before` is this device's copy, `after` the same group with the other
 * devices' changes merged in.
 */
export function upiChanges(before: Group, after: Group, now = Date.now()): Group["upiChangedAt"] {
	const seen = { ...after.upiChangedAt };
	for (const m of after.members) {
		const old = before.members.find((b) => b.id === m.id)?.upiId;
		if (old && old !== m.upiId) seen[m.id] = now;
	}
	for (const [id, at] of Object.entries(seen)) if (!(now - at < UPI_CHANGE_SHOWN_MS)) delete seen[id];
	return Object.keys(seen).length ? seen : undefined;
}

/** Whether this person's UPI ID was changed on another device lately. */
export const upiChangedLately = (group: Group, personId: string, now = Date.now()): boolean =>
	now - (group.upiChangedAt?.[personId] ?? -Infinity) < UPI_CHANGE_SHOWN_MS;
