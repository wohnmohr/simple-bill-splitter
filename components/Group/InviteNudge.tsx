"use client";

import { useEffect, useState } from "react";
import { Link2, X } from "lucide-react";
import { track } from "@/lib/analytics";

const storageKey = (groupId: string) => `splitbiller-invite-nudge-${groupId}`;

/**
 * Once a group has its first expense, suggests sending everyone the group link:
 * the moment it's worth more to them than a screenshot. Shown until the group
 * is shared or the card is dismissed, once per group.
 */
export const InviteNudge = ({ groupId, onInvite }: { groupId: string; onInvite: () => void }) => {
	const [hidden, setHidden] = useState(true);

	useEffect(() => {
		let seen = false;
		try {
			seen = localStorage.getItem(storageKey(groupId)) !== null;
		} catch {
			/* storage unavailable: show it */
		}
		setHidden(seen);
		if (!seen) track("invite_nudge_shown");
	}, [groupId]);

	const dismiss = () => {
		setHidden(true);
		track("invite_nudge_dismissed");
		try {
			localStorage.setItem(storageKey(groupId), "dismissed");
		} catch {
			/* storage unavailable: it will just show again next time */
		}
	};

	if (hidden) return null;

	return (
		<section className="surface relative mb-4 flex items-start gap-3 p-4" aria-labelledby="invite-nudge-title">
			<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden>
				<Link2 className="h-4 w-4" />
			</span>
			<div className="min-w-0 flex-1 pr-6">
				<h2 id="invite-nudge-title" className="font-semibold text-ink">
					Bring everyone in
				</h2>
				<p className="mt-0.5 text-sm text-ink-muted">
					Send the group one link. Everyone sees what they owe, pays by UPI and adds expenses from their own
					phone. End-to-end encrypted.
				</p>
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
			</div>
			<button type="button" onClick={dismiss} className="icon-btn absolute right-2 top-2" aria-label="Not now">
				<X className="h-4 w-4" />
			</button>
		</section>
	);
};
