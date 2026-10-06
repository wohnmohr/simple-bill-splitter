"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Lock } from "lucide-react";
import { SantaPayload, decodeRevealHash } from "@/utils/secretSanta";
import { TrackedLink } from "@/components/UI/TrackedLink";
import { track } from "@/lib/analytics";

/** Private reveal for one person. Tap to show, so nobody sees it over a shoulder. */
export const SecretSantaReveal = () => {
	const [state, setState] = useState<"loading" | "invalid" | SantaPayload>("loading");
	const [shown, setShown] = useState(false);

	useEffect(() => {
		const payload = decodeRevealHash(window.location.hash);
		setState(payload ?? "invalid");
	}, []);

	if (state === "loading") return null;

	if (state === "invalid") {
		return (
			<div className="mx-auto max-w-md space-y-4 py-16 text-center">
				<Gift className="mx-auto h-12 w-12 text-ink-muted" />
				<h1 className="font-display text-2xl font-semibold text-ink">This link doesn’t work</h1>
				<p className="text-sm text-ink-muted">
					Ask whoever ran the draw to send your link again. Or run your own Secret Santa — it’s free.
				</p>
				<Link href="/secret-santa-generator" className="btn-primary">
					Run a Secret Santa
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-md space-y-5 py-10 text-center">
			<div className="space-y-1">
				<p className="label-text">{state.e}</p>
				<h1 className="font-display text-3xl font-semibold text-ink">Hi {state.g}!</h1>
			</div>

			<div className="surface shadow-raised space-y-4 p-6">
				{shown ? (
					<>
						<p className="text-sm text-ink-muted">You’re Secret Santa for</p>
						<p className="font-display text-4xl font-semibold text-brand-700">{state.r}</p>
						{(state.b || state.d) && (
							<p className="text-sm text-ink-soft">
								{state.b && <>Budget {state.b}</>}
								{state.b && state.d && " · "}
								{state.d && <>Exchange on {state.d}</>}
							</p>
						)}
						<button type="button" onClick={() => setShown(false)} className="btn-secondary">
							<Lock className="h-4 w-4" />
							Hide
						</button>
					</>
				) : (
					<>
						<Gift className="mx-auto h-10 w-10 text-brand-700" />
						<p className="text-sm text-ink-soft">
							Make sure nobody is looking, then tap to see who you’re buying for.
						</p>
						<button
							type="button"
							onClick={() => {
								setShown(true);
								track("share_link_opened", { source: "secret-santa" });
							}}
							className="btn-primary w-full !py-3"
						>
							Reveal my match
						</button>
					</>
				)}
			</div>

			<p className="text-xs text-ink-muted">
				Keep it secret — this link shows your match to anyone who opens it. Nothing is stored on our servers.
			</p>
			<TrackedLink
				href="/secret-santa-generator"
				location="secret_santa_reveal"
				className="inline-block text-sm font-medium text-brand-700 hover:underline"
			>
				Run your own Secret Santa — free
			</TrackedLink>
		</div>
	);
};
