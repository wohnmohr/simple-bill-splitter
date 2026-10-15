/**
 * Reads a food or grocery order (Swiggy, Zomato, Instamart, Blinkit, Zepto…)
 * from the text of a screenshot, and splits it fairly by who had what.
 *
 * The text comes from on-device OCR, which reads the ₹ sign unreliably: as a
 * symbol (X, F, ¥, $, %…), as nothing, or as a digit, so "₹320" can arrive as
 * "3320"; it also loses decimal points ("₹17.98" as "1798"). Symbols are
 * stripped, every other plausible reading of an amount is kept, and the bill's
 * own arithmetic picks the likeliest set: items add up to the item total, and
 * the item total plus charges to the amount paid, give or take the rounding
 * to a whole rupee that apps apply to the total.
 *
 * Plain TypeScript with no imports, so it runs anywhere, including `node --test`.
 */

export type ChargeKind = "fee" | "tax" | "discount";

export type OrderItem = { name: string; qty: number; amount: number };
export type OrderCharge = { label: string; kind: ChargeKind; amount: number };

export type ParsedOrder = {
	/** Swiggy, Zomato, Instamart…, when the screenshot says so. */
	app?: string;
	/** Usually the restaurant or store: the first line that reads like a name. */
	title?: string;
	items: OrderItem[];
	/** Fees and taxes are positive, discounts negative. */
	charges: OrderCharge[];
	/** "Item total" as printed, if there was one. */
	itemTotal?: number;
	/** What was paid: "To Pay", "Grand Total", "Bill Total"… */
	total?: number;
	/** Whether the items and charges add up to what the bill says. */
	balanced: boolean;
};

/** Characters OCR produces in place of ₹ (or ahead of it). */
const CURRENCY_JUNK = /^(?:₹|rs\.?|inr|[xXfFrR¥$%€£zZ?=])+/i;
/** Digits OCR sometimes reads ₹ as. */
const RUPEE_DIGITS = new Set(["2", "3", "7"]);

const AMOUNT_AT_END =
	/([-−–]?)\s*((?:₹|rs\.?|inr|[xXfFrR¥$%€£zZ?=])*)\s*(\d(?:[\d,.]*\d)?)\s*$/i;
/** No food or grocery order is this big; bigger numbers are dates, ids or phone numbers. */
const MAX_AMOUNT = 1_000_000;

const TOTAL_RE = /(grand\s*total|to\s*pay|bill\s*total|total\s*(paid|payable|amount)|amount\s*paid|order\s*total|net\s*(payable|amount)|you\s*paid|paid\s*amount)/i;
const ITEM_TOTAL_RE = /(.?tem\s*total|items?\s*total|sub\s*-?\s*total|item\s*subtotal)/i;
const DISCOUNT_RE = /\b(discounts?|coupons?|offers?|promo\w*|cashback|savings?|off|deals?)\b/i;
const TAX_RE = /\b(gst|tax|taxes|cgst|sgst|igst|vat|restaurant\s*charges|cess)\b/i;
// Whole words: "Coffee" is not a fee, "Grain bowl" not a rain surcharge.
const FEE_RE = /\b(delivery|platform|packaging|packing|convenience|handling|surge|rain|small\s*(cart|order)|late\s*night|tip|donation|service\s*charge|feeding\s*india|fees?|charges?)\b/i;
/** "Total" alone, as paper bills print it, but not "Total tax" or "Total savings". */
const PLAIN_TOTAL_RE = /\btotal\b(?!\s*(tax|gst|savings?|saved|discount|qty|quantity|items?|includes|excl|before))/i;
/** Bill paperwork, not money: dates, times, phone, bill/table/check numbers, staff. */
const META_RE =
	/(\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{1,2}:\d{2}\b|\b\d{1,2}[- ](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[- ,']+\d{2,4}|\b(tel|ph|phone|mob|mobile|fax|cashier|server|steward|waiter|register|txn|kot|token|pax|covers?|guests?|seats?)\b|\b(bill|inv|chk|check|tbl|table|store|member|ref|trans(action)?|term\s*id)\s*(no\.?|#|:))/i;
const IGNORE_RE = /(order\s*(#|id|no)|#\s*\d|invoice|gstin|fssai|you\s*saved|total\s*savings|savings|rating|rate\s*(your|the)|delivered\s*(on|in|by)?|placed\s*on|paid\s*via|payment\s*mode|\bupi\b.*(ref|id)|(credit|debit)\s*card|tender|\bchange\b|\bvisa\b|mastercard|\bamex\b|\bbalance\b)/i;
const HEADER_RE = /^(items?|your\s*order|order\s*summary|bill\s*(details|summary)|order\s*details|summary|payment)$/i;
const QTY_BEFORE = /^(\d{1,2})\s*[xX×*]{1,2}\s+/;
const QTY_AFTER = /\s[xX×*]\s*(\d{1,2})\s*$/;

/** Named outright, or recognisable from each app's own wording on the bill. */
const APPS: [RegExp, string][] = [
	[/instamart/i, "Instamart"],
	[/blinkit/i, "Blinkit"],
	[/zepto/i, "Zepto"],
	[/zomato|delivery partner fee|grand total/i, "Zomato"],
	[/swiggy|gst and restaurant charges|\bto pay\b|bill total|one bl/i, "Swiggy"],
];

/**
 * One way to read an amount: as printed, without a leading digit that was
 * really ₹ (`strip`), and/or with the decimal point OCR lost put back (`point`).
 */
type Reading = { value: number; strip: boolean; point: boolean };
type Token = { raw: string; value: number; readings: Reading[]; negative: boolean; symbol: boolean };

/**
 * The amount at the end of a line. In photos, scraps of noise can follow the
 * price ("$16.00 EE =", "$4.28 2"): then the price is taken, unless the line
 * ends in a real amount or a word ("₹34 FREE").
 */
function amountAtEnd(line: string): { label: string; token: Token } | null {
	const strict = parseAmount(line);
	if (strict && (strict.token.symbol || !/^\d{1,2}$/.test(strict.token.raw))) return strict;
	const noisy = line.match(/^(.*\d\.\d{2})(?:\s+\S{1,3}){1,3}\s*$/);
	return (noisy && parseAmount(noisy[1])) || strict;
}

/** Parses the amount at the very end of a line, with every plausible reading of it. */
function parseAmount(line: string): { label: string; token: Token } | null {
	const m = line.match(AMOUNT_AT_END);
	if (!m || m.index === undefined) return null;
	// "Raita and Gravy x 1": a quantity, not a price ("X99" with no space is ₹99).
	if (!m[1] && (/^[xX×*]\s+\d{1,2}$/.test(m[0].trim()) || (!m[2] && /[xX×*]\s*$/.test(line.slice(0, m.index))))) return null;
	const [, minus, junk, digits] = m;
	// Only a final ".d" or ".dd" is paise; other dots and commas separate thousands ("1.018.60").
	const parts = digits.replace(/,/g, "").split(".");
	const paise = parts.length > 1 && parts[parts.length - 1].length <= 2 ? parts.pop() : "";
	const value = parseFloat(parts.join("") + (paise ? `.${paise}` : ""));
	if (!Number.isFinite(value) || value >= MAX_AMOUNT) return null;
	// Long plain integers are order ids or phone numbers, not money.
	if (!/[,.]/.test(digits) && digits.length >= 6) return null; // PIN codes too
	const readings: Reading[] = [{ value, strip: false, point: false }];
	if (!junk && RUPEE_DIGITS.has(digits[0]) && digits.length >= 2 && digits[1] !== "," && digits[1] !== "0") {
		const rest = parseFloat(digits.slice(1).replace(/,/g, ""));
		if (rest > 0) readings.push({ value: rest, strip: true, point: false });
	}
	// "1798" may be 17.98 with the point lost; a comma says it's a thousands figure.
	if (/^\d{3,}$/.test(digits)) {
		for (const r of [...readings]) if (String(r.value).length >= 3) readings.push({ ...r, value: r.value / 100, point: true });
	}
	return {
		label: line.slice(0, m.index).trim(),
		token: { raw: m[0].trim(), value, readings, negative: !!minus, symbol: !!junk },
	};
}

/** Cleans OCR noise from a line: veg/non-veg marks, stray brackets, doubled spaces. */
function clean(line: string): string {
	return line
		.replace(/^\s*[\[(][^\])]{0,3}[\])]\s*/, "") // "[e]", "(o)": the veg mark
		.replace(/^[^\p{L}\p{N}\[-]+/u, "") // "(®", "@®", "©)": the veg mark or an icon
		.replace(/^\[tem\b/i, "Item")
		.replace(/[|]\s*$/, "")
		.replace(/\s{2,}/g, " ")
		.trim();
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const near = (a: number, b: number) => Math.abs(a - b) < 0.015;

export function parseOrderText(text: string): ParsedOrder {
	const lines = text
		.split(/\r?\n/)
		.map(clean)
		.filter(Boolean);

	const app = APPS.find(([re]) => re.test(text))?.[1];
	type ItemRow = { name: string; qty: number; token: Token };
	type ChargeRow = { label: string; kind: ChargeKind; token: Token };
	const items: ItemRow[] = [];
	const charges: ChargeRow[] = [];
	let itemTotal: Token | undefined;
	let total: Token | undefined;
	let title: string | undefined;
	let inBill = false; // past "Item total": charges, not items
	// A plain "Total" may be a subtotal: if another total follows, it was.
	let maybeTotal: { token: Token; items: number; charges: number } | undefined;
	// A name line with no price, in case the price sits alone on the next line.
	let named: { line: string; joined?: { row: ItemRow; name: string; qty: number } } | undefined;

	let lastWasItem = false;
	for (const line of lines) {
		if (HEADER_RE.test(line)) {
			// "Bill details" above the items (Swiggy) still lists items; below them, only charges.
			if (/bill|payment/i.test(line) && items.length) inBill = true;
			lastWasItem = false;
			continue;
		}
		const found = amountAtEnd(line);
		const lastNamed = named;
		named = undefined;
		if (!found) {
			const prev = items[items.length - 1];
			if (!inBill && !IGNORE_RE.test(line) && !META_RE.test(line)) named = { line };
			if (lastWasItem && prev && !inBill && !IGNORE_RE.test(line) && !FEE_RE.test(line) && !/\bfree\b/i.test(line)) {
				// A wrapped item name, possibly carrying the quantity: "Raita and Gravy x 1".
				named = { line, joined: { row: prev, name: prev.name, qty: prev.qty } };
				const q = line.match(QTY_AFTER);
				prev.name = `${prev.name} ${line.replace(QTY_AFTER, "")}`.trim();
				if (q) prev.qty = parseInt(q[1], 10);
			} else if (!title && !inBill && !items.length && /^\p{L}[\p{L}\p{N} &'.,()-]{1,40}$/u.test(line) && !IGNORE_RE.test(line) && !META_RE.test(line)) {
				title = line;
			}
			lastWasItem = false;
			continue;
		}
		lastWasItem = false;
		const { token } = found;
		let { label } = found;
		// A price alone on its line belongs to the name above it, not to the item before.
		if (!label && lastNamed) {
			if (lastNamed.joined) Object.assign(lastNamed.joined.row, { name: lastNamed.joined.name, qty: lastNamed.joined.qty });
			label = lastNamed.line;
		}
		if (TOTAL_RE.test(label)) {
			if (maybeTotal) itemTotal ??= maybeTotal.token;
			total = token;
			break; // below the amount paid come savings and payment details
		}
		if (IGNORE_RE.test(label) || META_RE.test(line)) continue;
		if (ITEM_TOTAL_RE.test(label)) {
			itemTotal = token;
			inBill = true;
			continue;
		}
		if (PLAIN_TOTAL_RE.test(label)) {
			if (itemTotal || maybeTotal || !items.length) {
				if (maybeTotal) itemTotal ??= maybeTotal.token;
				total = token;
				break;
			}
			maybeTotal = { token, items: items.length, charges: charges.length };
			inBill = true;
			continue;
		}
		const hasQty = QTY_BEFORE.test(label) || QTY_AFTER.test(label);
		const discount = token.negative || DISCOUNT_RE.test(label);
		const tax = TAX_RE.test(label) && !/\bfee\b/i.test(label); // "Platform fee with GST" is a fee
		if (inBill || ((discount || tax || FEE_RE.test(label)) && !hasQty)) {
			const kind: ChargeKind = discount ? "discount" : tax ? "tax" : "fee";
			charges.push({ label: label.replace(/\s*\|\s*[\d.]+\s*kms?$/i, "") || kind, kind, token });
			continue;
		}
		let name = label;
		let qty = 1;
		const before = name.match(QTY_BEFORE);
		const after = name.match(QTY_AFTER);
		if (before) {
			qty = parseInt(before[1], 10);
			name = name.replace(QTY_BEFORE, "");
		} else if (after) {
			qty = parseInt(after[1], 10);
			name = name.replace(QTY_AFTER, "");
		}
		// A struck-out old price before the real one: "Choco Volcano Cake F119".
		name = name.replace(/\s+(?:₹|[xXfFrR¥$%])\d[\d,]*(?:\.\d{1,2})?$/, "").trim();
		// A capital I read as 1 at the start of a word: "1dli" (but not "1kg", "1pcs").
		name = name.replace(/(^|\s)1(?=[a-z]{3,}\b)(?!(?:pcs|pack|ltr|litre|liter|piece|pieces|nos)\b)/g, "$1I");
		if (name) {
			items.push({ name, qty, token });
			lastWasItem = true;
		}
	}

	// Only one plain total: it was the total, and what followed was payment details.
	if (maybeTotal && !total) {
		total = maybeTotal.token;
		items.length = maybeTotal.items;
		charges.length = maybeTotal.charges;
	}

	const resolved = reconcile(
		items.map((r) => r.token),
		itemTotal,
		charges.map((c) => ({ token: c.token, sign: c.kind === "discount" ? -1 : 1 })),
		total
	);
	const parsedCharges: OrderCharge[] = charges.flatMap((c, i) => {
		const v = resolved.charges[i];
		return v === null ? [] : [{ label: c.label, kind: c.kind, amount: c.kind === "discount" ? -v : v }];
	});
	// The app rounded what was paid to a whole rupee: show it, so everything adds up.
	if (resolved.rounding) {
		parsedCharges.push({ label: "Rounded off", kind: resolved.rounding < 0 ? "discount" : "fee", amount: resolved.rounding });
	}
	return {
		app,
		title,
		items: items.flatMap((r, i) => {
			const v = resolved.items[i];
			return v === null ? [] : [{ name: r.name, qty: r.qty, amount: v }];
		}),
		charges: parsedCharges,
		itemTotal: resolved.itemTotal,
		total: resolved.total,
		balanced: resolved.balanced,
	};
}

/** What leaving a line out of the bill costs, against 1 for each misreading fixed. */
const DROP = 3;

/** An amount in a sum: its readings in paise, each with how unlikely it is. */
type Term = { options: { paise: number; cost: number }[]; sign: number };

/**
 * Picks one reading per term so the signed sum lands within `tol` paise of
 * `target`, at the lowest total cost (then the smallest gap). Dynamic
 * programming over reachable sums, so it stays fast with many amounts.
 */
function solve(terms: Term[], target: number, tol: number): { picks: number[]; cost: number; gap: number } | null {
	type Node = { cost: number; pick: number; prev: Node | null };
	let reach = new Map<number, Node>([[0, { cost: 0, pick: -1, prev: null }]]);
	for (const term of terms) {
		const next = new Map<number, Node>();
		for (const [sum, node] of reach) {
			term.options.forEach((o, pick) => {
				const key = sum + term.sign * o.paise;
				const cost = node.cost + o.cost;
				const seen = next.get(key);
				if (!seen || cost < seen.cost) next.set(key, { cost, pick, prev: node });
			});
		}
		if (next.size > 200_000) return null; // not a real bill
		reach = next;
	}
	let best: { node: Node; gap: number } | null = null;
	for (const [sum, node] of reach) {
		const gap = Math.abs(sum - target);
		if (gap <= tol && (!best || node.cost < best.node.cost || (node.cost === best.node.cost && gap < best.gap))) best = { node, gap };
	}
	if (!best) return null;
	const picks: number[] = [];
	for (let n: Node | null = best.node; n && n.pick >= 0; n = n.prev) picks.unshift(n.pick);
	return { picks, cost: best.node.cost, gap: best.gap };
}

/**
 * Picks one reading for every amount so that the bill adds up: items to the
 * item total, and the item total plus charges to what was paid (within the
 * rounding to a whole rupee apps apply). Among the readings that work, the
 * likeliest wins: as printed, unless the bill shows ₹ signs elsewhere, in
 * which case a bare leading 2, 3 or 7 was more likely the ₹ itself.
 */
function reconcile(
	items: Token[],
	itemTotal: Token | undefined,
	charges: { token: Token; sign: number }[],
	total: Token | undefined
) {
	const all = [...items, ...(itemTotal ? [itemTotal] : []), ...charges.map((c) => c.token), ...(total ? [total] : [])];
	const symbols = all.some((t) => t.symbol);
	const cost = (r: Reading, t: Token) =>
		(t.readings.some((x) => x.strip) ? (r.strip === symbols ? 0 : 1) : 0) + (r.point ? 1 : 0);
	// Last option: the line isn't part of the bill at all (an address, a stray
	// number). Dearer than any misreading, so it's only taken when nothing else adds up.
	const term = (t: Token, sign = 1): Term => ({
		options: [...t.readings.map((r) => ({ paise: Math.round(r.value * 100), cost: cost(r, t) })), { paise: 0, cost: DROP }],
		sign,
	});
	const value = (t: Token, pick: number) => (pick < t.readings.length ? t.readings[pick].value : null);
	/** The likeliest reading on its own, for amounts no sum pins down. */
	const likeliest = (t: Token) => t.readings.reduce((b, r, i) => (cost(r, t) < cost(t.readings[b], t) ? i : b), 0);

	const itemTerms = items.map((t) => term(t));
	const chargeTerms = charges.map((c) => term(c.token, c.sign));
	type Plan = {
		score: number;
		cost: number;
		gap: number;
		iPick?: number;
		tPick?: number;
		itemPicks: number[];
		chargePicks: number[];
		checks: number;
	};
	let best: Plan | null = null;
	const iOptions = itemTotal ? itemTotal.readings.map((_, i) => i) : [undefined];
	const tOptions = total ? total.readings.map((_, i) => i) : [undefined];
	for (const iPick of iOptions) {
		for (const tPick of tOptions) {
			const iVal = iPick === undefined ? undefined : Math.round(itemTotal!.readings[iPick].value * 100);
			const tVal = tPick === undefined ? undefined : Math.round(total!.readings[tPick].value * 100);
			let planCost = (iPick === undefined ? 0 : cost(itemTotal!.readings[iPick], itemTotal!)) + (tPick === undefined ? 0 : cost(total!.readings[tPick], total!));
			let score = 0;
			let checks = 0;
			let gap = 0;
			let itemPicks = items.map(likeliest);
			let chargePicks = charges.map((c) => likeliest(c.token));
			// Whole-rupee totals may be rounded; others must match to the paisa.
			const tol = (t: number) => (t % 100 === 0 ? 50 : 1);
			if (iVal !== undefined && items.length) {
				checks++;
				const r = solve(itemTerms, iVal, 1);
				if (r) {
					score++;
					planCost += r.cost;
					itemPicks = r.picks;
				}
			}
			if (tVal !== undefined && (iVal !== undefined || items.length)) {
				checks++;
				const r = iVal !== undefined ? solve(chargeTerms, tVal - iVal, tol(tVal)) : solve([...itemTerms, ...chargeTerms], tVal, tol(tVal));
				if (r) {
					score++;
					planCost += r.cost;
					gap = r.gap;
					if (iVal !== undefined) chargePicks = r.picks;
					else {
						itemPicks = r.picks.slice(0, items.length);
						chargePicks = r.picks.slice(items.length);
					}
				}
			}
			const plan = { score, cost: planCost, gap, iPick, tPick, itemPicks, chargePicks, checks };
			if (!best || score > best.score || (score === best.score && (planCost < best.cost || (planCost === best.cost && gap < best.gap)))) best = plan;
		}
	}
	const plan = best!;
	const itemValues = items.map((t, i) => value(t, plan.itemPicks[i]));
	const chargeValues = charges.map((c, i) => value(c.token, plan.chargePicks[i]));
	const iTot = plan.iPick === undefined ? undefined : itemTotal!.readings[plan.iPick].value;
	const tot = plan.tPick === undefined ? undefined : total!.readings[plan.tPick].value;
	const itemSum = round2(itemValues.reduce<number>((a, b) => a + (b ?? 0), 0));
	const charged = round2((iTot ?? itemSum) + chargeValues.reduce<number>((a, b, i) => a + charges[i].sign * (b ?? 0), 0));
	// Verified only if the bill printed a total to check against, and it adds up.
	const balanced = plan.checks > 0 && plan.score === plan.checks;
	return {
		items: itemValues,
		itemTotal: iTot,
		charges: chargeValues,
		total: tot, // only what the bill printed: a sum of our own readings would vouch for itself
		balanced,
		rounding: balanced && tot !== undefined && !near(charged, tot) ? round2(tot - charged) : 0,
	};
}

/** What one person owes, and the items it came from. */
export type OrderShare = { personId: string; amount: number; itemAmount: number };

/**
 * Splits an order: each item between the people who had it (everyone, if
 * nobody is picked), and fees, taxes and discounts in proportion to what
 * each person ordered. Shares are in paise-exact rupees and add up to `total`.
 */
export function splitOrder(
	items: { amount: number; people: string[] }[],
	total: number,
	everyone: string[]
): OrderShare[] {
	const own = new Map(everyone.map((id) => [id, 0]));
	for (const item of items) {
		const sharers = (item.people.length ? item.people : everyone).filter((id) => own.has(id));
		if (!sharers.length || !(item.amount > 0)) continue;
		for (const id of sharers) own.set(id, own.get(id)! + item.amount / sharers.length);
	}
	const itemSum = Array.from(own.values()).reduce((a, b) => a + b, 0);
	const active = everyone.filter((id) => own.get(id)! > 0);
	if (!(total > 0) || !everyone.length) return [];
	// No items yet: an even split of the total.
	const weights = itemSum > 0 ? active.map((id) => own.get(id)! / itemSum) : everyone.map(() => 1 / everyone.length);
	const ids = itemSum > 0 ? active : everyone;

	// Largest-remainder rounding to the paisa, so shares sum to the total exactly.
	const paise = Math.round(total * 100);
	const raw = weights.map((w) => w * paise);
	const floors = raw.map(Math.floor);
	let left = paise - floors.reduce((a, b) => a + b, 0);
	const order = raw.map((r, i) => [r - floors[i], i] as const).sort((a, b) => b[0] - a[0]);
	for (const [, i] of order) {
		if (left <= 0) break;
		floors[i] += 1;
		left -= 1;
	}
	return ids.map((id, i) => ({ personId: id, amount: floors[i] / 100, itemAmount: round2(own.get(id) ?? 0) }));
}
