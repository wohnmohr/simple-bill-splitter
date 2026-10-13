"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PayRequest } from "@/utils/payStory";
import { addCloudPayment, loadCloudSplit } from "@/utils/splitCloud";
import { SplitViewKeyed as SplitView } from "./views";

const POLL_MS = 15_000;

type State = { status: "loading" } | { status: "ok"; req: PayRequest } | { status: "missing" | "locked" | "offline" };

const MESSAGES = {
	missing: ["This split has ended", "It may have expired, or the link was copied incompletely."],
	locked: ["This link can’t be opened", "The key at the end of the link is missing or wrong. Ask the organiser to send it again."],
	offline: ["Couldn’t load this split", "Check your connection and try again."],
} as const;

/** A cloud split: decrypts in the browser with the key from the #fragment and stays in sync. */
export const CloudSplitApp = ({ id }: { id: string }) => {
	const [state, setState] = useState<State>({ status: "loading" });
	const [saveError, setSaveError] = useState("");
	const key = useRef("");
	const pending = useRef(0);

	const refresh = useCallback(async () => {
		if (pending.current) return; // don't overwrite an optimistic payment mid-save
		const next = await loadCloudSplit(id, key.current);
		if (next.status === "ok") setState(next);
		else setState((prev) => (prev.status === "ok" && next.status === "offline" ? prev : next));
	}, [id]);

	useEffect(() => {
		const readKey = () => {
			key.current = window.location.hash.slice(1);
			refresh();
		};
		readKey();
		const tick = () => document.visibilityState === "visible" && refresh();
		const timer = window.setInterval(tick, POLL_MS);
		document.addEventListener("visibilitychange", tick);
		window.addEventListener("hashchange", readKey);
		return () => {
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", tick);
			window.removeEventListener("hashchange", readKey);
		};
	}, [refresh]);

	const record = useCallback(
		async (next: PayRequest) => {
			if (state.status !== "ok") return;
			const payment = next.paid[next.paid.length - 1];
			const before = state.req;
			setSaveError("");
			setState({ status: "ok", req: next });
			pending.current++;
			try {
				await addCloudPayment(id, key.current, payment);
			} catch {
				setState({ status: "ok", req: before });
				setSaveError("Couldn’t save your payment mark. Check your connection and tap “I’ve paid” again.");
			} finally {
				pending.current--;
			}
			refresh();
		},
		[id, state, refresh]
	);

	if (state.status === "loading") {
		return <div className="flex min-h-[60vh] items-center justify-center text-ink-muted" aria-live="polite">🔒 Decrypting split…</div>;
	}
	if (state.status !== "ok") {
		const [title, body] = MESSAGES[state.status];
		return (
			<div className="mx-auto max-w-md px-4 py-20 text-center">
				<h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
				<p className="mt-2 text-ink-muted">{body}</p>
				<Link href="/split" className="btn-primary mt-6">Make a new split</Link>
			</div>
		);
	}
	return (
		<>
			{saveError && <p role="alert" className="bg-negative-soft px-4 py-3 text-center text-sm font-semibold text-negative">{saveError}</p>}
			<SplitView req={state.req} onChange={record} shareUrl={typeof window === "undefined" ? undefined : window.location.href} />
		</>
	);
};
