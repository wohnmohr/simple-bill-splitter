"use client";

import { useEffect, useState } from "react";
import { Check, Link2, MessageCircle, X } from "lucide-react";
import type { Group, GroupSyncLink } from "@/types";
import { MemberAvatar } from "@/components/Group/MemberAvatar";
import { calculateSettlements } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatting";
import { groupUrl } from "@/utils/groupSync";
import { shownMembers } from "@/utils/identity";
import { oweMessage, sendViaWhatsApp } from "@/utils/whatsapp";
import { track, trackError } from "@/lib/analytics";
import { inviteNudgeKey } from "@/utils/shareImport";


interface InviteNudgeProps {
	group: Group;
	/** Shares the group (turning sync on if it isn't) and returns its link. */
	shareLink: () => Promise<GroupSyncLink>;
	/** The general invite, when nobody owes you yet. */
	onInvite: () => void;
}

/**
 * Once a group has its first expense, asks you to send each person what they
 * owe you, with their own link into the group: "you owe me" gets answered, and
 * the link brings them in. When nobody owes you, it offers the group link.
 * Shown until the card is dismissed, once per group; for a group that was
 * already shared, only while you're sending from it.
 */
export const InviteNudge = ({ group, shareLink, onInvite }: InviteNudgeProps) => {
	const [dismissed, setDismissed] = useState(true);
	/**
	 * Who you tapped Send for on this visit: "sent", or "copied" on a computer.
	 * We can't tell if WhatsApp actually sent it, so the row offers to send again.
	 */
	const [sent, setSent] = useState<Record<string, "sent" | "copied">>({});

	const owed = group.meId ? calculateSettlements(group.members, group.expenses).filter((s) => s.to === group.meId) : [];
	const me = group.members.find((m) => m.id === group.meId);
	const names = Object.fromEntries(shownMembers(group).map((p) => [p.id, p]));
	const visible = !dismissed && (!group.sync || Object.keys(sent).length > 0);

	useEffect(() => {
		let seen = false;
		try {
			seen = localStorage.getItem(inviteNudgeKey(group.id)) !== null;
		} catch {
			/* storage unavailable: show it */
		}
		setDismissed(seen);
		setSent({});
	}, [group.id]);

	useEffect(() => {
		if (visible) track("invite_nudge_shown");
	}, [visible]);

	const dismiss = () => {
		setDismissed(true);
		track("invite_nudge_dismissed");
		try {
			localStorage.setItem(inviteNudgeKey(group.id), "dismissed");
		} catch {
			/* storage unavailable: it will just show again next time */
		}
	};

	// Their own link opens the group as them, on what they owe; the message uses shared names, not nicknames.
	const send = async (personId: string, amount: number) => {
		track("invite_nudge_sent", { was_shared: !!group.sync });
		try {
			const link = await shareLink();
			const name = group.members.find((m) => m.id === personId)?.name ?? "";
			const owes = formatCurrency(amount, group.currency);
			const upi = group.currency.code === "INR" && me?.upiId ? { id: me.upiId, amount } : undefined;
			const result = await sendViaWhatsApp(oweMessage(name, `I added ${group.name} on SplitBiller`, owes, groupUrl(link, personId, true), upi));
			if (result !== "failed") setSent((prev) => ({ ...prev, [personId]: result === "copied" ? "copied" : "sent" }));
		} catch (err) {
			trackError(err, { source: "invite_nudge_send" });
		}
	};

	if (!visible) return null;

	return (
		<section className="surface relative mb-4 p-4" aria-labelledby="invite-nudge-title">
			<h2 id="invite-nudge-title" className="pr-8 font-semibold text-ink">
				{owed.length ? "Send everyone their share" : "Bring everyone in"}
			</h2>
			<p className="mt-0.5 pr-6 text-sm text-ink-muted">
				{owed.length
					? "Each gets a private link to the group to see it and pay you by UPI. End-to-end encrypted."
					: "Send the group one link. Everyone sees what they owe and adds expenses from their own phone. End-to-end encrypted."}
			</p>
			{owed.length ? (
				<ul className="mt-3 divide-y divide-line">
					{owed.map((s) => {
						const person = names[s.from];
						const done = sent[s.from];
						return (
							<li key={s.from} className="flex items-center gap-3 py-2">
								{person && <MemberAvatar person={person} size="sm" />}
								<p className="min-w-0 flex-1 truncate text-sm text-ink">
									<span className="font-medium">{person?.name}</span>{" "}
									<span className="text-ink-muted">owes you</span>{" "}
									<span className="font-semibold tabular-nums">{formatCurrency(s.amount, group.currency)}</span>
								</p>
								<button
									type="button"
									onClick={() => send(s.from, s.amount)}
									className={done ? "btn-ghost shrink-0 !py-1.5" : "btn-primary shrink-0 !py-1.5"}
								>
									{done ? <Check className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
									{done === "copied" ? "Copy again" : done ? "Send again" : "Send"}
								</button>
							</li>
						);
					})}
				</ul>
			) : (
				<button
					type="button"
					onClick={() => {
						track("invite_nudge_clicked");
						onInvite();
					}}
					className="btn-primary mt-3 !py-2"
				>
					<Link2 className="h-4 w-4" />
					Invite with a link
				</button>
			)}
			<button type="button" onClick={dismiss} className="icon-btn absolute right-2 top-2" aria-label="Not now">
				<X className="h-4 w-4" />
			</button>
		</section>
	);
};
