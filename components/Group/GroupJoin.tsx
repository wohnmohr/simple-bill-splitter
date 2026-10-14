"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Lock } from "lucide-react";
import type { Group, GroupSyncLink } from "@/types";
import { MAX_GROUPS } from "@/constants";
import { track } from "@/lib/analytics";
import { joinGroup } from "@/utils/groupSync";
import { type GroupLink, parseGroupFragment, stretchPassphrase } from "@/utils/groupVault";
import { newId } from "@/utils/ids";
import { loadGroupsFromStorage, saveGroupsToStorage } from "@/utils/storage";

type State =
	| { step: "opening" }
	| { step: "passphrase"; wrong?: boolean }
	| { step: "error"; title: string; body: string; retry?: boolean };

const ERRORS = {
	invalid: ["This link can't be opened", "It looks incomplete. Ask the person who shared it to send it again."],
	gone: ["This group isn't available", "It was deleted, or its link was reset. Ask someone in the group for the new link."],
	offline: ["Couldn't reach SplitBiller", "Check your connection and try again."],
	limit: ["Too many groups on this device", `You already have ${MAX_GROUPS} groups. Remove one, then open this link again.`],
} as const;

const openOnDashboard = (router: ReturnType<typeof useRouter>, groupId: string) => {
	try {
		sessionStorage.setItem("splitbiller-select-group", groupId);
	} catch {
		/* the dashboard opens on the list instead */
	}
	router.replace("/dashboard");
};

/** Opens a group link: asks for the passphrase if needed, decrypts, and saves the group on this device. */
export const GroupJoin = () => {
	const router = useRouter();
	const link = useRef<GroupLink | null>(null);
	const lastTried = useRef<GroupSyncLink | null>(null);
	const [state, setState] = useState<State>({ step: "opening" });
	const [passphrase, setPassphrase] = useState("");
	const [working, setWorking] = useState(false);

	const fail = (kind: keyof typeof ERRORS, retry = false) => {
		track("group_join_failed", { reason: kind });
		setState({ step: "error", title: ERRORS[kind][0], body: ERRORS[kind][1], retry });
	};

	const open = async (sync: GroupSyncLink) => {
		lastTried.current = sync;
		const groups = loadGroupsFromStorage();
		const existing = groups.find((g) => g.sync?.secret === sync.secret);
		if (existing) return openOnDashboard(router, existing.id);
		if (groups.length >= MAX_GROUPS) return fail("limit");
		const localId = newId("group");
		const result = await joinGroup(sync, localId);
		if (!result.ok) {
			if (result.reason === "wrong-passphrase") return setState({ step: "passphrase", wrong: true });
			return fail(result.reason, result.reason === "offline");
		}
		const joined: Group = { ...result.group, sync };
		saveGroupsToStorage([...loadGroupsFromStorage(), joined]);
		track("group_joined", { passphrase: Boolean(sync.pass), members: joined.members.length });
		openOnDashboard(router, localId);
	};

	useEffect(() => {
		const parsed = parseGroupFragment(window.location.hash);
		// Keep the key out of the address bar and session history once read.
		if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
		link.current = parsed;
		if (!parsed) return fail("invalid");
		if (parsed.needsPassphrase) {
			const known = loadGroupsFromStorage().find((g) => g.sync?.secret === parsed.secret);
			if (known) return openOnDashboard(router, known.id);
			return setState({ step: "passphrase" });
		}
		void open({ secret: parsed.secret });
		// eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per page load
	}, []);

	const submitPassphrase = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!link.current || !passphrase || working) return;
		setWorking(true);
		try {
			await open({ secret: link.current.secret, pass: await stretchPassphrase(link.current.secret, passphrase) });
		} finally {
			setWorking(false);
		}
	};

	return (
		<div className="mx-auto max-w-md px-4 py-16">
			{state.step === "opening" && (
				<p className="flex items-center justify-center gap-2 text-ink-muted" aria-live="polite">
					<Loader2 className="h-4 w-4 animate-spin" />
					Decrypting group…
				</p>
			)}

			{state.step === "passphrase" && (
				<form onSubmit={submitPassphrase} className="surface p-6">
					<span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
						<KeyRound className="h-5 w-5" />
					</span>
					<h1 className="mt-4 font-display text-2xl font-semibold text-ink">Enter the group passphrase</h1>
					<p className="mt-1 text-ink-muted">
						This group needs a passphrase as well as the link. Ask the person who shared it.
					</p>
					<input
						type="password"
						autoComplete="current-password"
						autoFocus
						value={passphrase}
						onChange={(e) => setPassphrase(e.target.value)}
						aria-invalid={state.wrong || undefined}
						aria-describedby={state.wrong ? "pass-error" : undefined}
						className="mt-4 w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-base text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
					/>
					{state.wrong && (
						<p id="pass-error" role="alert" className="mt-2 text-sm text-negative">
							That passphrase doesn&apos;t open this group.
						</p>
					)}
					<button type="submit" disabled={!passphrase || working} className="btn-primary mt-4 w-full !py-3">
						{working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
						{working ? "Unlocking…" : "Open group"}
					</button>
				</form>
			)}

			{state.step === "error" && (
				<div className="text-center">
					<h1 className="font-display text-2xl font-semibold text-ink">{state.title}</h1>
					<p className="mt-2 text-ink-muted">{state.body}</p>
					<div className="mt-6 flex justify-center gap-2">
						{state.retry && lastTried.current && (
							<button type="button" className="btn-primary" onClick={() => { setState({ step: "opening" }); void open(lastTried.current!); }}>
								Try again
							</button>
						)}
						<Link href="/dashboard" className="btn-secondary">Your groups</Link>
					</div>
				</div>
			)}
		</div>
	);
};
