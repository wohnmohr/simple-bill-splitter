/**
 * Reads a food or grocery order (Swiggy, Zomato, Instamart, Blinkit, Zepto…)
 * from the text of a screenshot, and splits it fairly by who had what.
 *
 * The text comes from on-device OCR, which reads the ₹ sign unreliably: as a
 * symbol (X, F, ¥, $, %…), as nothing, or as a digit, so "₹320" can arrive as
 * "3320". Symbols are stripped; for a leading digit both readings are kept and
 * the bill's own arithmetic picks the right one (items add up to the item
 * total, and the item total plus charges to the amount paid).
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
const DISCOUNT_RE = /(discount|coupon|offer|promo|cashback|saving|off\b|\bdeal)/i;
const TAX_RE = /(gst|\btax|cgst|sgst|igst|restaurant\s*charges|cess)/i;
const FEE_RE = /(delivery|platform|packaging|packing|convenience|handling|surge|rain|small\s*(cart|order)|late\s*night|\btip\b|donation|service\s*charge|feeding\s*india|fee\b|charge)/i;
const IGNORE_RE = /(order\s*(#|id|no)|#\s*\d|invoice|gstin|fssai|you\s*saved|total\s*savings|savings|rating|rate\s*(your|the)|delivered\s*(on|in|by)?|placed\s*on|paid\s*via|payment\s*mode|\bupi\b.*(ref|id))/i;
const HEADER_RE = /^(items?|your\s*order|order\s*summary|bill\s*(details|summary)|order\s*details|summary|payment)$/i;
const QTY_BEFORE = /^(\d{1,2})\s*[xX×*]{1,2}\s+/;
const QTY_AFTER = /\s[xX×*]\s*(\d{1,2})\s*$/;

/** Named outright, or recognisable from each app's own wording on the bill. */
const APPS: [RegExp, string][] = [
	[/instamart/i, "Instamart"],
	[/blinkit/i, "Blinkit"],
	[/zepto/i, "Zepto"],
	[/swiggy|gst and restaurant charges|\bto pay\b/i, "Swiggy"],
	[/zomato|delivery partner fee|grand total/i, "Zomato"],
];

type Token = { raw: string; value: number; candidates: number[]; negative: boolean };

/** Parses the amount at the end of a line, keeping both readings when ₹ may have become a digit. */
function amountAtEnd(line: string): { label: string; token: Token } | null {
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
	if (!/[,.]/.test(digits) && digits.length >= 7) return null;
	const candidates = [value];
	if (!junk && RUPEE_DIGITS.has(digits[0]) && digits.length >= 2 && digits[1] !== "," && digits[1] !== "0") {
		const rest = parseFloat(digits.slice(1).replace(/,/g, ""));
		if (rest > 0) candidates.push(rest);
	}
	return {
		label: line.slice(0, m.index).trim(),
		token: { raw: m[0].trim(), value, candidates, negative: !!minus },
	};
}

/** Cleans OCR noise from a line: veg/non-veg marks, stray brackets, doubled spaces. */
function clean(line: string): string {
	return line
		.replace(/^\s*[\[(][^\])]{0,3}[\])]\s*/, "") // "[e]", "(o)": the veg mark
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

	let lastWasItem = false;
	for (const line of lines) {
		if (HEADER_RE.test(line)) {
			if (/bill|payment/i.test(line)) inBill = true;
			lastWasItem = false;
			continue;
		}
		const found = amountAtEnd(line);
		if (!found) {
			const prev = items[items.length - 1];
			if (lastWasItem && prev && !inBill && !IGNORE_RE.test(line) && !FEE_RE.test(line) && !/\bfree\b/i.test(line)) {
				// A wrapped item name, possibly carrying the quantity: "Raita and Gravy x 1".
				const q = line.match(QTY_AFTER);
				prev.name = `${prev.name} ${line.replace(QTY_AFTER, "")}`.trim();
				if (q) prev.qty = parseInt(q[1], 10);
			} else if (!title && !inBill && !items.length && /^\p{L}[\p{L}\p{N} &'.,()-]{1,40}$/u.test(line) && !IGNORE_RE.test(line)) {
				title = line;
			}
			lastWasItem = false;
			continue;
		}
		lastWasItem = false;
		const { label, token } = found;
		if (TOTAL_RE.test(label)) {
			total = token;
			break; // below the amount paid come savings and payment details
		}
		if (IGNORE_RE.test(label)) continue;
		if (ITEM_TOTAL_RE.test(label)) {
			itemTotal = token;
			inBill = true;
			continue;
		}
		const hasQty = QTY_BEFORE.test(label) || QTY_AFTER.test(label);
		const discount = token.negative || DISCOUNT_RE.test(label);
		const tax = TAX_RE.test(label);
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
		if (name) {
			items.push({ name, qty, token });
			lastWasItem = true;
		}
	}

	const resolved = reconcile(
		items.map((r) => r.token),
		itemTotal,
		charges.map((c) => ({ token: c.token, sign: c.kind === "discount" ? -1 : 1 })),
		total
	);
	return {
		app,
		title,
		items: items.map((r, i) => ({ name: r.name, qty: r.qty, amount: resolved.items[i] })),
		charges: charges.map((c, i) => ({
			label: c.label,
			kind: c.kind,
			amount: c.kind === "discount" ? -Math.abs(resolved.charges[i]) : resolved.charges[i],
		})),
		itemTotal: resolved.itemTotal,
		total: resolved.total,
		balanced: resolved.balanced,
	};
}

/**
 * Picks one reading for every ambiguous amount so that the bill adds up,
 * preferring the amounts exactly as read when several readings work.
 */
function reconcile(
	items: Token[],
	itemTotal: Token | undefined,
	charges: { token: Token; sign: number }[],
	total: Token | undefined
) {
	const all = [...items, ...(itemTotal ? [itemTotal] : []), ...charges.map((c) => c.token), ...(total ? [total] : [])];
	const ambiguous = all.map((t, i) => (t.candidates.length > 1 ? i : -1)).filter((i) => i >= 0);
	const pick = (choice: number[]) => {
		const v = all.map((t) => t.value);
		ambiguous.forEach((idx, k) => (v[idx] = all[idx].candidates[choice[k]]));
		let p = 0;
		const it = v.slice(p, (p += items.length));
		const iTot = itemTotal ? v[p++] : undefined;
		const ch = v.slice(p, (p += charges.length));
		const tot = total ? v[p++] : undefined;
		return { it, iTot, ch, tot };
	};
	const score = (r: ReturnType<typeof pick>) => {
		const itemSum = round2(r.it.reduce((a, b) => a + b, 0));
		const base = r.iTot ?? itemSum;
		const charged = round2(base + r.ch.reduce((a, b, i) => a + charges[i].sign * Math.abs(b), 0));
		let s = 0;
		if (r.iTot !== undefined && items.length) s += near(itemSum, r.iTot) ? 2 : 0;
		if (r.tot !== undefined) s += near(charged, r.tot) ? 2 : 0;
		return { s, itemSum, charged };
	};
	const max = (r: ReturnType<typeof pick>) => (r.iTot !== undefined && items.length ? 2 : 0) + (r.tot !== undefined ? 2 : 0);

	let best = pick(ambiguous.map(() => 0));
	let bestScore = score(best).s;
	let bestStrips = 0;
	if (ambiguous.length <= 14 && bestScore < max(best)) {
		for (let mask = 1; mask < 1 << ambiguous.length; mask++) {
			const choice = ambiguous.map((_, k) => (mask >> k) & 1);
			const r = pick(choice);
			const s = score(r).s;
			const strips = choice.reduce((a, b) => a + b, 0);
			if (s > bestScore || (s === bestScore && s > 0 && strips < bestStrips)) {
				best = r;
				bestScore = s;
				bestStrips = strips;
			}
		}
	}
	const { itemSum, charged } = score(best);
	const total_ = best.tot ?? (items.length || best.iTot !== undefined ? charged : undefined);
	return {
		items: best.it,
		itemTotal: best.iTot,
		charges: best.ch.map(Math.abs),
		total: total_,
		balanced:
			(best.iTot === undefined || !items.length || near(itemSum, best.iTot)) &&
			(best.tot === undefined || near(charged, best.tot)) &&
			(items.length > 0 || best.iTot !== undefined),
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
