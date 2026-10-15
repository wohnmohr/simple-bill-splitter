/**
 * Monthly expenses: rent, Wi-Fi, subscriptions.
 *
 * A repeating expense is an ordinary expense (the first month) that carries
 * `repeat.next`, the month its next copy is due. Whichever device opens the
 * group after that day adds the copy and moves `next` on. Copies get ids made
 * from the original's id and the month, so two phones doing this at once write
 * the same entries rather than duplicates, and a copy someone deleted stays
 * deleted because `next` has already moved past it. No server, no cron: it
 * works the same for groups on one phone and end-to-end encrypted ones.
 *
 * Pure functions with only type imports, so they run in the browser and in node tests.
 */
import type { Expense } from "@/types";

/** At most this many months are filled in when a group hasn't been opened for a long time. */
export const MAX_CATCH_UP = 12;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const isMonthKey = (v: unknown): v is string => typeof v === "string" && MONTH_RE.test(v);

/** "YYYY-MM" of a local date. */
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** The month `months` after `key`. */
const addMonths = (key: string, months: number) => {
	const [y, m] = key.split("-").map(Number);
	return monthKey(new Date(y, m - 1 + months, 1));
};

/** The month after the one `date` falls in: when a new repeating expense's first copy is due. */
export const firstRepeat = (date: number) => addMonths(monthKey(new Date(date)), 1);

/** Local noon on `day` of `month`, moved back to the last day of short months (the 31st becomes the 30th). */
export const dueAt = (month: string, day: number) => {
	const [y, m] = month.split("-").map(Number);
	return new Date(y, m - 1, Math.min(day, new Date(y, m, 0).getDate()), 12).getTime();
};

/**
 * Adds every copy of a repeating expense that has come due by `now`, and moves
 * each original's `repeat.next` past them. Returns the same array when nothing
 * is due, so callers can skip an update.
 */
export function addDueRepeats(expenses: Expense[], now = Date.now()): Expense[] {
	let out: Expense[] | null = null;
	const oldest = addMonths(monthKey(new Date(now)), 1 - MAX_CATCH_UP);
	expenses.forEach((e, index) => {
		if (!e.repeat || e.kind || !isMonthKey(e.repeat.next)) return;
		const day = new Date(e.createdAt ?? now).getDate();
		const { repeat, ...template } = e;
		// "YYYY-MM" strings sort like the months they name.
		let next = repeat.next < oldest ? oldest : repeat.next;
		const copies: Expense[] = [];
		while (dueAt(next, day) <= now) {
			copies.push({ ...template, id: `${e.id}-${next}`, createdAt: dueAt(next, day) });
			next = addMonths(next, 1);
		}
		if (copies.length === 0) return;
		out ??= [...expenses];
		out[index] = { ...e, repeat: { next } };
		const have = new Set(out.map((x) => x.id));
		out.push(...copies.filter((c) => !have.has(c.id)));
	});
	return out ?? expenses;
}
