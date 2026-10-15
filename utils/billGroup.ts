import { CURRENCIES } from "@/constants";
import type { Expense, Person } from "@/types";
import type { ShareSnapshot } from "@/types/share";
import { personKey } from "@/utils/billClaims";
import { firstMarks, sharePerPerson, type PayRequest } from "@/utils/payStory";

/** Who was in a split and their part of it. */
type Board = { diners: { name: string; share: number }[] };

/**
 * Turns a claimed bill into a group: the organiser and everyone who claimed
 * become members, the bill becomes one expense the organiser paid with each
 * person's exact share, and every payment marked becomes a settlement.
 */
export function billToGroup(req: PayRequest, board: Board): { snapshot: ShareSnapshot; meId: string } {
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
	const amounts = Object.fromEntries(board.diners.filter((d) => d.share > 0).map((d) => [idOf.get(personKey(d.name))!, d.share]));
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
	// One payment per person, even when both they and the organiser marked it.
	const settlements: Expense[] = firstMarks(req.paid).flatMap(([name, amount], i) => {
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

/**
 * The same for a plain split link (a trip fund, a gift): the organiser and
 * everyone who paid become members. Only payers have names, so the group holds
 * what was paid, settled, ready for the next expense.
 */
export const splitToGroup = (req: PayRequest) =>
	billToGroup(req, {
		diners: [
			{ name: req.name, share: sharePerPerson(req) },
			...firstMarks(req.paid)
				.filter(([name]) => personKey(name) && personKey(name) !== personKey(req.name))
				.map(([name, share]) => ({ name, share })),
		],
	});
