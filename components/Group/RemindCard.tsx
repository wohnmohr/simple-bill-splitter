"use client";

import { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import type { Group } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { shownMembers } from "@/utils/identity";
import { dueReminders, reminderKey, type DueReminder } from "@/utils/reminders";
import { reminderText } from "@/utils/reminderText";
import { sendViaWhatsApp } from "@/utils/whatsapp";
import { track, trackError } from "@/lib/analytics";

const STORAGE_KEY = "splitbiller-reminded";
const MAX_ROWS = 3;

const loadReminded = (): Record<string, number> => {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
	} catch {
		return {};
	}
};

/**
 * Money people still owe you in groups that have gone quiet, with one tap to
 * send each a WhatsApp reminder. Worked out on this device; nothing is sent
 * until you tap.
 */
export const RemindCard = ({ groups }: { groups: Group[] }) => {
	// Read after mount: the time and this device's storage aren't known on the server.
	const [reminded, setReminded] = useState<Record<string, number> | null>(null);
	// Rows tapped on this visit stay, offering to remind again: we can't tell if WhatsApp actually sent it.
	const [tapped, setTapped] = useState<string[]>([]);
	const [copied, setCopied] = useState<string | null>(null);
	useEffect(() => setReminded(loadReminded()), []);

	if (!reminded) return null;
	const due = dueReminders(groups, reminded, Date.now()).slice(0, MAX_ROWS);

	const remind = async ({ group, settlement }: DueReminder) => {
		const key = reminderKey(group.id, settlement.from);
		track("settlement_remind_clicked", { synced: !!group.sync, source: "home" });
		try {
			if ((await sendViaWhatsApp(await reminderText(group, settlement))) === "copied") {
				setCopied("Reminder copied. Paste it in your chat.");
				setTimeout(() => setCopied(null), 3000);
			}
			setTapped((prev) => (prev.includes(key) ? prev : [...prev, key]));
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadReminded(), [key]: Date.now() }));
		} catch (err) {
			trackError(err, { source: "home_remind" });
		}
	};

	if (!due.length) return null;

	return (
		<section className="surface p-4" aria-labelledby="remind-card-title">
			<h2 id="remind-card-title" className="font-semibold text-ink">Still waiting on</h2>
			<ul className="mt-2 divide-y divide-line">
				{due.map((d) => {
					const key = reminderKey(d.group.id, d.settlement.from);
					const name = shownMembers(d.group).find((m) => m.id === d.settlement.from)?.name ?? "Someone";
					const again = tapped.includes(key);
					return (
						<li key={key} className="flex items-center gap-3 py-2.5">
							<div className="min-w-0 flex-1">
								{/* Wraps instead of truncating: an amount someone owes is never cut short. */}
								<p className="break-words text-ink">
									{name} owes you{" "}
									<span className="whitespace-nowrap font-semibold tabular-nums text-positive">
										{formatCurrency(d.settlement.amount, d.group.currency)}
									</span>
								</p>
								<p className="truncate text-sm text-ink-muted">
									{d.group.name} · quiet for {d.days} days
								</p>
							</div>
							<button type="button" onClick={() => remind(d)} className={`btn-ghost shrink-0 ${again ? "" : "!text-brand-700"}`}>
								{again ? <Check className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
								{again ? "Remind again" : "Remind"}
							</button>
						</li>
					);
				})}
			</ul>
			{copied && (
				<p role="status" className="mt-2 flex items-center gap-1.5 text-sm text-positive">
					<Check className="h-4 w-4" />
					{copied}
				</p>
			)}
		</section>
	);
};
