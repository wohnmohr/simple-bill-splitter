"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import type { Group } from "@/types";
import { alertsOn, alertsSupported, disableAlerts, enableAlerts } from "@/utils/groupAlerts";
import { track } from "@/lib/analytics";

/** iPhones only allow alerts from SplitBiller once it's on the Home Screen. */
const isIosBrowser = () =>
	/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia("(display-mode: standalone)").matches;

/** "Tell me when someone adds an expense", for one synced group on this device. */
export const AlertsToggle = ({ group }: { group: Group }) => {
	const [on, setOn] = useState(false);
	const [busy, setBusy] = useState(false);
	const [note, setNote] = useState("");
	const [supported, setSupported] = useState(true);

	useEffect(() => {
		setSupported(alertsSupported());
		void alertsOn(group).then(setOn).catch(() => setOn(false));
	}, [group.sync?.secret]); // eslint-disable-line react-hooks/exhaustive-deps -- the toggle follows the group's link

	if (!supported) {
		return isIosBrowser() ? (
			<p className="flex gap-2 rounded-xl border border-line p-3 text-sm text-ink-muted">
				<Bell className="mt-0.5 h-4 w-4 shrink-0" />
				To get alerts on iPhone, add SplitBiller to your Home Screen first (Share, then Add to Home Screen).
			</p>
		) : null;
	}

	const toggle = async () => {
		setBusy(true);
		setNote("");
		try {
			if (on) {
				await disableAlerts(group);
				setOn(false);
				track("group_alerts_off");
			} else if (await enableAlerts(group)) {
				setOn(true);
				track("group_alerts_on");
			} else {
				setNote("Alerts are blocked for SplitBiller in your browser settings.");
			}
		} catch {
			setNote("Couldn't change alerts. Check your connection and try again.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="rounded-xl border border-line p-3">
			<button type="button" role="switch" aria-checked={on} onClick={toggle} disabled={busy} className="flex w-full items-center gap-3 text-left">
				<span className="min-w-0 flex-1">
					<span className="block text-sm font-semibold text-ink">Tell me when someone adds an expense</span>
					<span className="block text-sm text-ink-muted">
						Only on this device. Our server learns that it wants alerts for this group, never what&apos;s in it.
					</span>
				</span>
				{busy ? (
					<Loader2 className="h-5 w-5 shrink-0 animate-spin text-ink-muted" />
				) : (
					<span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-brand-700" : "bg-line-strong"}`} aria-hidden>
						<span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-[left] ${on ? "left-[18px]" : "left-0.5"}`} />
					</span>
				)}
			</button>
			{note && <p role="alert" className="mt-2 text-sm text-negative">{note}</p>}
		</div>
	);
};
