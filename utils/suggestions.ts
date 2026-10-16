/**
 * Suggestions from a group's own history, worked out on the device: what
 * people add often, what they add every month, and what someone may have
 * added already. Nothing here leaves the phone.
 */
import type { Expense } from "@/types";

const DAY = 24 * 60 * 60 * 1000;
const key = (description?: string) => description?.trim().toLowerCase() ?? "";
const spending = (expenses: Expense[]) => expenses.filter((e) => e.kind !== "payment" && key(e.description));

/**
 * Past expenses to start a new one from, the latest of each description.
 * With no text: the ones added most often. With text: those whose words start with it.
 */
export function suggestPast(expenses: Expense[], text: string, limit = 3): Expense[] {
	const latest = new Map<string, Expense>();
	const count = new Map<string, number>();
	for (const e of spending(expenses)) {
		const k = key(e.description);
		latest.set(k, e);
		count.set(k, (count.get(k) ?? 0) + 1);
	}
	const typed = key(text);
	const order = [...latest.keys()].reverse(); // newest first
	const picks = typed
		? order.filter((k) => k !== typed && (k.startsWith(typed) || k.split(/\s+/).some((word) => word.startsWith(typed))))
		: order.filter((k) => count.get(k)! > 1).sort((a, b) => count.get(b)! - count.get(a)!);
	return picks.slice(0, limit).map((k) => latest.get(k)!);
}

const monthOf = (ms: number) => {
	const d = new Date(ms);
	return d.getFullYear() * 12 + d.getMonth();
};

/** True when an expense like this was added in two or more different months and none repeats yet. */
export function looksMonthly(expenses: Expense[], description: string): boolean {
	const k = key(description);
	if (!k) return false;
	const same = spending(expenses).filter((e) => key(e.description) === k);
	if (same.some((e) => e.repeat)) return false;
	return new Set(same.filter((e) => e.createdAt).map((e) => monthOf(e.createdAt!))).size >= 2;
}

/** An expense of the same amount added within two days of `at`: maybe someone added it already. */
export const findDuplicate = (expenses: Expense[], amount: number, at: number): Expense | undefined =>
	expenses.find(
		(e) => e.kind !== "payment" && Math.abs(e.amount - amount) < 0.01 && !!e.createdAt && Math.abs(e.createdAt - at) < 2 * DAY
	);
