import type { Expense, Group, Person } from "@/types";
import { newId } from "@/utils/ids";
import { firstRepeat } from "@/utils/recurring";
import { splitFields } from "@/utils/calculations";
import type { QuickResolved } from "@/utils/quickAdd";

/**
 * Adds a confirmed quick-add preview to a group: the new people who are in an
 * expense become members, and the expenses are saved the way the expense form
 * saves them. If the person typing was new to the group, they become its "me".
 */
export function applyQuickAdd(group: Group, quick: QuickResolved, now = Date.now()): Group {
	const used = new Set(quick.expenses.flatMap((e) => [e.paidBy, ...e.participants]));
	const ids = new Map(group.members.map((m) => [m.id, m.id]));
	const added: Person[] = [];
	for (const p of quick.people) {
		if (!p.isNew || !used.has(p.key)) continue;
		const id = newId("person");
		ids.set(p.key, id);
		added.push({ id, name: p.name.trim().slice(0, 40) });
	}
	const id = (key: string) => ids.get(key)!;
	const byId = (weights: Record<string, number>) => Object.fromEntries(Object.entries(weights).map(([k, v]) => [id(k), v]));

	const expenses: Expense[] = quick.expenses.map((e) => ({
		id: newId("expense"),
		amount: e.amount,
		paidBy: id(e.paidBy),
		participants: e.participants.map(id),
		description: e.description.trim() || undefined,
		...splitFields(e.splitMethod, e.weights && byId(e.weights)),
		createdAt: e.date ?? now,
		...(e.monthly ? { repeat: { next: firstRepeat(now) } } : {}),
	}));

	const me = quick.people.find((p) => p.isMe && used.has(p.key));
	return {
		...group,
		members: [...group.members, ...added],
		expenses: [...group.expenses, ...expenses],
		...(me && !group.meId ? { meId: id(me.key) } : {}),
	};
}
