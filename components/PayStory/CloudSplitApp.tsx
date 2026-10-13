"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { PayRequest } from "@/utils/payStory";
import { SPLIT_TTL_DAYS, addCloudPayment, loadCloudSplit } from "@/utils/splitCloud";
import { SplitViewKeyed as SplitView } from "./views";

// Live while someone is looking; quieter when idle; silent when away. Keeps reads cheap.
const POLL_MS = 15_000;
const SLOW_AFTER_MS = 5 * 60_000; // then poll every 60s
const STOP_AFTER_MS = 30 * 60_000; // then wait for the person to come back

type State = { status: "loading" } | { status: "ok"; req: PayRequest; expiresAt: number } | { status: "missing" | "locked" | "offline" };

const MESSAGES = {
	missing: ["This split has ended", `Split links are deleted automatically ${SPLIT_TTL_DAYS} days after they’re made, or the link may have been copied incompletely.`],
	locked: ["This link can’t be opened", "The key at the end of the link is missing or wrong. Ask the organiser to send it again."],
	offline: ["Couldn’t load this split", "Check your connection and try again."],
} as const;

/** A cloud split: decrypts in the browser with the key from the #fragment and stays in sync. */
export const CloudSplitApp = ({ id }: { id: string }) => {
	const [state, setState] = useState<State>({ status: "loading" });
	const [saveError, setSaveError] = useState("");
	const key = useRef("");
	const pending = useRef(0);
	const reported = useRef(false);
	const version = useRef<number | undefined>(undefined);
	const lastActive = useRef(Date.now());

	const refresh = useCallback(async () => {
		if (pending.current) return; // don't overwrite an optimistic payment mid-save
		const next = await loadCloudSplit(id, key.current, version.current);
		if (next.status === "unchanged") return;
		if (next.status === "ok") {
			version.current = next.version;
			return setState({ status: "ok", req: next.req, expiresAt: next.expiresAt });
		}
		setState((prev) => {
			if (prev.status === "ok" && next.status === "offline") return prev; // keep showing what we have
			if (!reported.current) {
				reported.current = true;
				track("split_open_failed", { reason: next.status });
			}
			return next;
		});
	}, [id]);

	useEffect(() => {
		const readKey = () => {
			key.current = window.location.hash.slice(1);
			version.current = undefined;
			refresh();
		};
		readKey();
		let ticks = 0;
		const tick = () => {
			ticks++;
			if (document.visibilityState !== "visible") return;
			const idle = Date.now() - lastActive.current;
			if (idle > STOP_AFTER_MS) return;
			if (idle > SLOW_AFTER_MS && ticks % 4 !== 0) return;
			refresh();
		};
		const wake = () => {
			const wasAway = Date.now() - lastActive.current > SLOW_AFTER_MS;
			lastActive.current = Date.now();
			if (wasAway && document.visibilityState === "visible") refresh();
		};
		const timer = window.setInterval(tick, POLL_MS);
		document.addEventListener("visibilitychange", wake);
		window.addEventListener("pointerdown", wake);
		window.addEventListener("keydown", wake);
		window.addEventListener("hashchange", readKey);
		return () => {
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", wake);
			window.removeEventListener("pointerdown", wake);
			window.removeEventListener("keydown", wake);
			window.removeEventListener("hashchange", readKey);
		};
	}, [refresh]);

	const record = useCallback(
		async (next: PayRequest) => {
			if (state.status !== "ok") return;
			const payment = next.paid[next.paid.length - 1];
			const before = state.req;
			setSaveError("");
			setState({ status: "ok", req: next, expiresAt: state.expiresAt });
			pending.current++;
			try {
				await addCloudPayment(id, key.current, payment);
			} catch {
				setState({ status: "ok", req: before, expiresAt: state.expiresAt });
				setSaveError("Couldn’t save that payment mark. Check your connection and try again.");
			} finally {
				pending.current--;
			}
			version.current = undefined;
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
			<SplitView req={state.req} onChange={record} expiresAt={state.expiresAt} shareUrl={typeof window === "undefined" ? undefined : window.location.href} />
		</>
	);
};
