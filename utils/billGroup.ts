import { CURRENCIES } from "@/constants";
import type { Expense, Person } from "@/types";
import type { ShareSnapshot } from "@/types/share";
import { personKey, type Tally } from "@/utils/billClaims";
import type { PayRequest } from "@/utils/payStory";

/**
 * Turns a claimed bill into a group: the organiser and everyone who claimed
 * become members, the bill becomes one expense the organiser paid with each
 * person's exact share, and every payment marked becomes a settlement.
 */
export function billToGroup(req: PayRequest, board: Tally): { snapshot: ShareSnapshot; meId: string } {
	const organiserKey = personKey(req.name);
	const members: Person[] = [{ id: "p1", name: req.name, upiId: req.upiId }];
	const idOf = new Map([[organiserKey, "p1"]]);
	for (const d of board.diners) {
		const key = personKey(d.name);
		if (idOf.has(key)) continue;
		idOf.set(key, `p${members.length + 1}`);
		members.push({ id: `p${members.length + 1}`, name: d.name.trim() });
	}

	const now = Date.now();
	const amounts = Object.fromEntries(board.diners.map((d) => [idOf.get(personKey(d.name))!, d.share]));
	const bill: Expense = {
		id: "bill",
		amount: Object.values(amounts).reduce((s, a) => s + a, 0),
		paidBy: "p1",
		participants: Object.keys(amounts),
		description: req.title,
		splitMethod: "exact",
		amounts,
		createdAt: now,
	};
	const settlements: Expense[] = req.paid.flatMap(([name, amount], i) => {
		const from = idOf.get(personKey(name));
		return from && from !== "p1"
			? [{ id: `paid-${i}`, amount, paidBy: from, participants: ["p1"], description: "UPI payment", splitMethod: "equally" as const, kind: "payment" as const, createdAt: now }]
			: [];
	});

	return {
		snapshot: { name: req.title, currency: CURRENCIES.find((c) => c.code === "INR")!, members, expenses: bill.amount > 0 ? [bill, ...settlements] : [] },
		meId: "p1",
	};
}
