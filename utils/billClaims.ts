/**
 * "Tap what you ate": an itemised bill that each friend splits for themselves.
 *
 * The organiser shares the bill's lines. Each friend claims the lines they had;
 * a line claimed by several people is shared equally between them. Taxes, fees,
 * discounts and rounding are spread in proportion to each person's items, so
 * every share is (their items) × (bill total ÷ item total), rounded up to a
 * whole rupee for UPI.
 *
 * Pure functions with no imports, so they run in the browser and in node tests.
 */

/** A bill line as [name, rupees]; amounts may carry paise. */
export type BillItem = [string, number];
/** Who had what, as [first name, item indices]. A person's latest claim replaces their earlier ones. */
export type Claim = [string, number[]];

export const MAX_ITEMS = 40;
const MAX_ITEM_NAME = 40;

/** Who a record is for: "Priya", " priya " and "PRIYA" are the same person. */
export const personKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

const money = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n > 0 && n < 1e7 ? Math.round(n * 100) / 100 : 0);

/** Bill lines from untrusted input; null unless there's at least one priced line. */
export function sanitizeItems(raw: unknown): BillItem[] | null {
	if (!Array.isArray(raw)) return null;
	const items = raw
		.slice(0, MAX_ITEMS)
		.filter((i): i is [unknown, unknown] => Array.isArray(i))
		.map(([n, a]): BillItem => [typeof n === "string" ? n.trim().slice(0, MAX_ITEM_NAME) : "", money(a)])
		.filter(([, a]) => a > 0);
	return items.length ? items : null;
}

/** One claim from untrusted input, against a bill of `count` lines; null if malformed. */
export function sanitizeClaim(raw: unknown, count: number): Claim | null {
	if (!Array.isArray(raw) || typeof raw[0] !== "string" || !Array.isArray(raw[1])) return null;
	const name = raw[0].trim().slice(0, 30);
	if (!personKey(name)) return null;
	const picks = raw[1].filter((i): i is number => Number.isInteger(i) && i >= 0 && i < count);
	return [name, Array.from(new Set(picks)).sort((a, b) => a - b)];
}

/** The bill total to collect: whole rupees, rounded up so the organiser is never short. */
export const billTarget = (total: number) => Math.ceil(Math.round(total * 100) / 100);

export type Diner = {
	name: string;
	items: number[];
	/** Their part of the item prices, before taxes, fees and discounts. */
	own: number;
	/** Rupees to pay, everything included, rounded up. */
	share: number;
	/** Marked paid, or the organiser (who paid the bill). */
	paid: boolean;
	organiser: boolean;
};

export type Tally = {
	diners: Diner[];
	/** Names of the people sharing each line, in bill order. */
	claimers: string[][];
	claimedItems: number;
	/** Share of the target nobody has claimed yet. */
	unclaimed: number;
	/** Collected so far: payments marked plus the organiser's own share. */
	collected: number;
	/** Everything's claimed and everyone but the organiser has paid. */
	done: boolean;
};

type Bill = { target: number; name: string; items: BillItem[]; claims: Claim[]; paid: [string, number][] };

/** Who had what and what each person owes, from the bill, every claim and every payment mark. */
export function tally({ target, name: organiser, items, claims, paid }: Bill): Tally {
	// Latest claim per person, kept where they first appeared so the list doesn't jump around.
	const latest = new Map<string, Claim>();
	for (const claim of claims) latest.set(personKey(claim[0]), claim);
	const active = Array.from(latest.values()).filter(([, picks]) => picks.length > 0);

	const claimers: string[][] = items.map(() => []);
	for (const [name, picks] of active) for (const i of picks) claimers[i]?.push(name);

	const itemSum = items.reduce((s, [, a]) => s + a, 0);
	const scale = itemSum > 0 ? target / itemSum : 0;
	const own = (picks: number[]) => picks.reduce((s, i) => s + (claimers[i]?.length ? items[i][1] / claimers[i].length : 0), 0);
	// Shares are rounded up, so drop float dust first: 299.99999 should be 300, not 301.
	const rupees = (n: number) => Math.ceil(Math.round(n * 100) / 100);

	const paidBy = new Set(paid.map(([n]) => personKey(n)));
	const organiserKey = personKey(organiser);
	const diners = active.map(([name, picks]): Diner => {
		const key = personKey(name);
		const isOrganiser = key === organiserKey;
		const mine = own(picks);
		return { name, items: picks, own: Math.round(mine * 100) / 100, share: rupees(mine * scale), paid: isOrganiser || paidBy.has(key), organiser: isOrganiser };
	});

	const unclaimedItems = items.reduce((s, [, a], i) => s + (claimers[i].length ? 0 : a), 0);
	const marked = paid.reduce((s, [n, a]) => s + (personKey(n) === organiserKey ? 0 : a), 0);
	const organiserShare = diners.find((d) => d.organiser)?.share ?? 0;
	const claimedItems = claimers.filter((c) => c.length).length;
	return {
		diners,
		claimers,
		claimedItems,
		unclaimed: rupees(unclaimedItems * scale),
		collected: Math.min(marked + organiserShare, target),
		done: claimedItems === items.length && diners.every((d) => d.paid),
	};
}
