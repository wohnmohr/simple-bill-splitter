import type { Group, Settlement } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { groupUrl } from "@/utils/groupSync";
import { buildShareSnapshot, encodeShareUrl } from "@/utils/shareCodec";
import { isValidUpiId } from "@/utils/upi";
import { oweMessage } from "@/utils/whatsapp";

type Remindable = Pick<Group, "name" | "currency" | "members" | "expenses" | "sync">;

/**
 * The WhatsApp reminder for one settlement, with a link that lands the debtor on
 * what they owe: in a shared group, their personal link (it opens the group as
 * them, on settle-up); otherwise the encrypted summary, which they can save as a
 * group. Uses shared names, never this device's nicknames: the message goes to them.
 * (UPI links aren't tappable in WhatsApp, so the pay button lives behind the link.)
 */
export async function reminderText(group: Remindable, s: Settlement): Promise<string> {
	const debtor = group.members.find((p) => p.id === s.from);
	const creditor = group.members.find((p) => p.id === s.to);
	const url = group.sync
		? groupUrl(group.sync, s.from, true)
		: await encodeShareUrl(buildShareSnapshot({ name: group.name, currency: group.currency, members: group.members, expenses: group.expenses }));
	const upi = group.currency.code === "INR" && creditor?.upiId && isValidUpiId(creditor.upiId) ? { id: creditor.upiId, amount: s.amount } : undefined;
	return oweMessage(debtor?.name || "", `a reminder for ${group.name}`, formatCurrency(s.amount, group.currency), url, upi);
}
