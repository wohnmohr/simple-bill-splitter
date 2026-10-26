import type { Currency, Expense, Group, Person } from "@/types";
import { expensePayers } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatting";

/**
 * Light-hearted titles a group's people earn from its expenses, worked out on
 * the phone from the group's own data. Each title goes to one person and each
 * person gets at most one, so they spread around the table; anyone left over
 * who shared in the spending is "Good company". Nothing here ranks who owes.
 */
export type AwardId = "spender" | "rounds" | "bigBill" | "fastest" | "allIn" | "nightOwl" | "company";

export type Award = {
	id: AwardId;
	title: string;
	personId: string;
	/** What earned it, in the award's own unit: money, a count, or milliseconds. */
	value: number;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type Stats = { paid: number; rounds: number; biggest: number; in: number; late: number; payDelay?: number };

const isSpend = (e: Expense) => e.kind !== "payment";
const isLate = (at?: number) => {
	if (!at) return false;
	const h = new Date(at).getHours();
	return h >= 22 || h < 4;
};

/** When the latest expense `personId` shared in, up to `until`, was added (0 if none has a time). */
const lastShared = (expenses: Expense[], personId: string, until: number) =>
	expenses
		.filter((e) => isSpend(e) && e.createdAt && e.createdAt <= until && e.participants.includes(personId))
		.reduce((latest, e) => Math.max(latest, e.createdAt!), 0);

/**
 * How long after the last expense they shared in each payment of theirs came,
 * newest first. Payments or expenses without a time are left out.
 */
export const paymentDelays = (expenses: Expense[], personId: string): { at: number; delay: number }[] =>
	expenses
		.filter((e) => e.kind === "payment" && e.paidBy === personId && e.createdAt)
		.flatMap((p) => {
			const from = lastShared(expenses, personId, p.createdAt!);
			return from ? [{ at: p.createdAt!, delay: p.createdAt! - from }] : [];
		})
		.sort((a, b) => b.at - a.at);

const statsFor = (expenses: Expense[], personId: string, unit: number): Stats => {
	const s: Stats = { paid: 0, rounds: 0, biggest: 0, in: 0, late: 0 };
	for (const e of expenses.filter(isSpend)) {
		const paid = expensePayers(e, unit).get(personId) ?? 0;
		if (paid > 0) {
			s.paid += paid;
			s.rounds++;
			s.biggest = Math.max(s.biggest, paid);
			if (isLate(e.createdAt)) s.late++;
		}
		if (e.participants.includes(personId)) s.in++;
	}
	const delays = paymentDelays(expenses, personId);
	if (delays.length) s.payDelay = delays.reduce((sum, d) => sum + d.delay, 0) / delays.length;
	return s;
};

/** In the order they're handed out: each goes to its top scorer who has no award yet. A score of 0 or less doesn't qualify. */
const AWARDS: { id: AwardId; title: string; score: (s: Stats) => number; value: (s: Stats) => number }[] = [
	{ id: "spender", title: "Big spender", score: (s) => s.paid, value: (s) => s.paid },
	{ id: "rounds", title: "Chai sponsor", score: (s) => s.rounds, value: (s) => s.rounds },
	{ id: "fastest", title: "Fastest payer", score: (s) => (s.payDelay === undefined ? 0 : 1 / (1 + s.payDelay)), value: (s) => s.payDelay ?? 0 },
	{ id: "nightOwl", title: "Night owl", score: (s) => s.late, value: (s) => s.late },
	{ id: "bigBill", title: "Took the big bill", score: (s) => s.biggest, value: (s) => s.biggest },
	{ id: "allIn", title: "Always in", score: (s) => s.in, value: (s) => s.in },
];
const COMPANY = { id: "company" as const, title: "Good company" };

/** The group's awards, in hand-out order, then "Good company" for everyone else who shared in the spending. */
export const groupAwards = (group: Pick<Group, "members" | "expenses">, unit = 100): Award[] => {
	const stats = new Map(group.members.map((p) => [p.id, statsFor(group.expenses, p.id, unit)]));
	const sharers = group.members.filter((p) => stats.get(p.id)!.in > 0);
	if (sharers.length < 2) return [];
	const awards: Award[] = [];
	const taken = new Set<string>();
	for (const a of AWARDS) {
		let best: Person | undefined;
		for (const p of group.members) {
			const score = a.score(stats.get(p.id)!);
			if (score > 0 && !taken.has(p.id) && (!best || score > a.score(stats.get(best.id)!))) best = p;
		}
		if (!best) continue;
		taken.add(best.id);
		awards.push({ id: a.id, title: a.title, personId: best.id, value: a.value(stats.get(best.id)!) });
	}
	for (const p of sharers) {
		if (!taken.has(p.id)) awards.push({ ...COMPANY, personId: p.id, value: stats.get(p.id)!.in });
	}
	return awards;
};

const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);

const howLong = (ms: number) =>
	ms < HOUR ? "within the hour" : ms < DAY ? `in ${Math.round(ms / HOUR)} h` : `in ${Math.round(ms / DAY)} d`;

/** What earned an award, in a few words. With `amounts` off, money stays off the line (for a card people post). */
export const awardDetail = (award: Award, currency: Currency, amounts = true): string => {
	switch (award.id) {
		case "spender":
			return amounts ? `paid ${formatCurrency(award.value, currency)}` : "paid the most";
		case "rounds":
			return `paid ${times(award.value)}`;
		case "fastest":
			return `paid back ${howLong(award.value)}`;
		case "bigBill":
			return amounts ? `${formatCurrency(award.value, currency)} in one go` : "the biggest single bill";
		case "nightOwl":
			return `paid ${times(award.value)} after 10 pm`;
		case "allIn":
		case "company":
			return `in on ${award.value} ${award.value === 1 ? "expense" : "expenses"}`;
	}
};

/** Award id → who holds it, as remembered between visits. */
export type AwardHolders = Partial<Record<AwardId, string>>;

export const holdersOf = (awards: Award[]): AwardHolders =>
	Object.fromEntries(awards.filter((a) => a.id !== "company").map((a) => [a.id, a.personId]));

/**
 * The first award that changed hands to or from you since `before`, for a
 * "you took it" / "they took yours" note. Null when nothing of yours moved.
 */
export const awardNews = (
	before: AwardHolders,
	awards: Award[],
	meId: string
): { award: Award; gained: boolean; other?: string } | null => {
	for (const award of awards) {
		const was = before[award.id];
		if (award.id === "company" || was === award.personId) continue;
		if (award.personId === meId) return { award, gained: true, other: was };
		if (was === meId) return { award, gained: false, other: award.personId };
	}
	return null;
};

/**
 * Your settle streak: how many of your latest payments, across groups, came
 * within a day of the last expense you shared in, counting back to the first
 * late one.
 */
export const settleStreak = (groups: Pick<Group, "expenses" | "meId">[]): number => {
	const mine = groups
		.flatMap((g) => (g.meId ? paymentDelays(g.expenses, g.meId) : []))
		.sort((a, b) => b.at - a.at);
	const late = mine.findIndex((p) => p.delay > DAY);
	return late === -1 ? mine.length : late;
};

/** Whether paying now, in this group, keeps the streak going. */
export const paysOnTime = (expenses: Expense[], personId: string, now = Date.now()): boolean => {
	const from = lastShared(expenses, personId, now);
	return from > 0 && now - from <= DAY;
};
