"use client";

import { useEffect, useState } from "react";
import { Smartphone, X } from "lucide-react";
import { promptInstall, useCanInstall } from "@/lib/installPrompt";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "splitbiller-install-card";

/**
 * Offers to put SplitBiller on the home screen, for people already using it.
 * Only where the browser can install it in one tap; dismissing hides it for good.
 */
export const InstallCard = () => {
	const canInstall = useCanInstall();
	const [dismissed, setDismissed] = useState(true);

	useEffect(() => {
		try {
			setDismissed(localStorage.getItem(STORAGE_KEY) !== null);
		} catch {
			setDismissed(false);
		}
	}, []);

	const visible = canInstall && !dismissed;
	useEffect(() => {
		if (visible) track("install_prompt_shown");
	}, [visible]);

	const remember = (outcome: "dismissed" | "installed") => {
		setDismissed(true);
		try {
			localStorage.setItem(STORAGE_KEY, outcome);
		} catch {
			/* storage unavailable: it will just offer again next time */
		}
	};

	const install = async () => {
		track("install_prompt_clicked");
		// Declining the browser's dialog doesn't hide the card; the browser decides when to offer again.
		if (await promptInstall()) remember("installed");
	};

	if (!visible) return null;

	return (
		<section className="surface relative mt-4 flex items-start gap-3 p-4" aria-labelledby="install-card-title">
			<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden>
				<Smartphone className="h-4 w-4" />
			</span>
			<div className="min-w-0 flex-1 pr-6">
				<h2 id="install-card-title" className="font-semibold text-ink">
					Add SplitBiller to your home screen
				</h2>
				<p className="mt-0.5 text-sm text-ink-muted">Your groups, one tap away. No app store needed.</p>
				<button type="button" onClick={install} className="btn-secondary mt-3 !py-2">
					Install
				</button>
			</div>
			<button
				type="button"
				onClick={() => {
					track("install_prompt_dismissed");
					remember("dismissed");
				}}
				className="icon-btn absolute right-2 top-2"
				aria-label="Not now"
			>
				<X className="h-4 w-4" />
			</button>
		</section>
	);
};
