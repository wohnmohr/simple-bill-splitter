import type { Group, Settlement } from "@/types";
import { calculateSettlements, minorUnits } from "@/utils/calculations";

const DAY = 86_400_000;
/** A group quiet this long with money still owed is worth a nudge; a reminder then rests this long too. */
export const QUIET_DAYS = 3;

export type DueReminder = { group: Group; settlement: Settlement; days: number };

/** Key for when you last reminded someone in a group, in the `reminded` map. */
export const reminderKey = (groupId: string, personId: string) => `${groupId}:${personId}`;

/**
 * Money owed to you in open groups that have gone quiet for QUIET_DAYS, biggest
 * first, skipping anyone you reminded in that time. Worked out on this device only.
 */
export function dueReminders(groups: Group[], reminded: Record<string, number>, now: number): DueReminder[] {
	const due: DueReminder[] = [];
	for (const group of groups) {
		if (group.closedAt || !group.meId) continue;
		const last = Math.max(0, ...group.expenses.map((e) => e.createdAt ?? 0));
		const days = Math.floor((now - last) / DAY);
		if (!last || days < QUIET_DAYS) continue;
		for (const s of calculateSettlements(group.members, group.expenses, minorUnits(group.currency))) {
			const since = reminded[reminderKey(group.id, s.from)] ?? 0;
			if (s.to === group.meId && now - since >= QUIET_DAYS * DAY) due.push({ group, settlement: s, days });
		}
	}
	return due.sort((a, b) => b.settlement.amount - a.settlement.amount);
}
