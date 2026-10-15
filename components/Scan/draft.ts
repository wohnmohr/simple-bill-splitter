import { splitOrder, type ChargeKind, type ParsedOrder } from "@/utils/orderBill";

/** An order being reviewed: everything editable, amounts as typed. */
export type DraftItem = { key: string; name: string; amount: string; people: string[] };
export type DraftCharge = { key: string; label: string; kind: ChargeKind; amount: string };
export type DraftOrder = { title: string; items: DraftItem[]; charges: DraftCharge[]; total: string };

/** sessionStorage key for a bill handed from the order splitter to "tap what you ate", read once. */
export const BILL_DRAFT_KEY = "splitbiller-bill-draft";

let seq = 0;
export const draftKey = () => `d${++seq}`;

/** An amount as it's written on a bill: "190", "17.20". */
const str = (n: number | undefined) => (n === undefined ? "" : Number.isInteger(n) ? String(n) : n.toFixed(2));
export const num = (s: string) => {
	const n = parseFloat(s.replace(/,/g, ""));
	return Number.isFinite(n) ? n : 0;
};

export function draftFromOrder(order: ParsedOrder): DraftOrder {
	return {
		title: order.title || (order.app ? `${order.app} order` : "Food order"),
		items: order.items.map((i) => ({
			key: draftKey(),
			name: i.qty > 1 ? `${i.name} ×${i.qty}` : i.name,
			amount: str(i.amount),
			people: [],
		})),
		charges: order.charges.map((c) => ({ key: draftKey(), label: c.label, kind: c.kind, amount: str(Math.abs(c.amount)) })),
		total: str(order.total),
	};
}

export const emptyDraft = (): DraftOrder => ({
	title: "Food order",
	items: [{ key: draftKey(), name: "", amount: "", people: [] }],
	charges: [],
	total: "",
});

/** Items, the charges as signed amounts, and whether they meet the total paid. */
export function draftTotals(d: DraftOrder) {
	const items = d.items.reduce((s, i) => s + num(i.amount), 0);
	const charges = d.charges.reduce((s, c) => s + (c.kind === "discount" ? -1 : 1) * Math.abs(num(c.amount)), 0);
	const computed = Math.round((items + charges) * 100) / 100;
	const total = d.total.trim() ? num(d.total) : computed;
	return { items: Math.round(items * 100) / 100, charges: Math.round(charges * 100) / 100, computed, total, balanced: Math.abs(computed - total) < 0.015 };
}

/** Each person's share of what was paid. */
export function draftShares(d: DraftOrder, everyone: string[]) {
	const { total } = draftTotals(d);
	return splitOrder(
		d.items.map((i) => ({ amount: num(i.amount), people: i.people })),
		total,
		everyone
	);
}
