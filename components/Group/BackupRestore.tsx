"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import type { Group, GroupSyncLink } from "@/types";
import { MAX_GROUPS } from "@/constants";
import { track } from "@/lib/analytics";
import { HttpError } from "@/utils/groupApi";
import { loadBackup, mergeRestored, readBackup, storeBackup } from "@/utils/groupBackup";
import { type GroupLink, parseGroupFragment, stretchPassphrase } from "@/utils/groupVault";
import { loadGroupsFromStorage, saveGroupsToStorage } from "@/utils/storage";

type State =
	| { step: "opening" }
	| { step: "passphrase"; wrong?: boolean }
	| { step: "found"; link: GroupSyncLink; groups: Group[] }
	| { step: "error"; title: string; body: string; retry?: boolean };

const ERRORS = {
	invalid: ["This link can't be opened", "It looks incomplete. Copy the whole recovery link and try again."],
	gone: ["This backup isn't available", "It was turned off, or deleted after 6 months unused."],
	offline: ["Couldn't reach SplitBiller", "Check your connection and try again."],
} as const;

const plural = (n: number) => `${n} group${n === 1 ? "" : "s"}`;

/** Opens a recovery link: asks for the passphrase if needed, decrypts the backup, and adds its groups to this device. */
export const BackupRestore = () => {
	const router = useRouter();
	const link = useRef<GroupLink | null>(null);
	const lastTried = useRef<GroupSyncLink | null>(null);
	const [state, setState] = useState<State>({ step: "opening" });
	const [passphrase, setPassphrase] = useState("");
	const [working, setWorking] = useState(false);

	const fail = (kind: keyof typeof ERRORS, retry = false) => {
		track("backup_restore_failed", { reason: kind });
		setState({ step: "error", title: ERRORS[kind][0], body: ERRORS[kind][1], retry });
	};

	const open = async (sync: GroupSyncLink) => {
		lastTried.current = sync;
		try {
			setState({ step: "found", link: sync, groups: await readBackup(sync) });
		} catch (err) {
			if (err instanceof HttpError && err.status === 403) return setState({ step: "passphrase", wrong: true });
			if (err instanceof HttpError && err.status === 404) return fail("gone");
			if (err instanceof HttpError) return fail("invalid");
			fail(err instanceof Error && err.message === "not a backup" ? "invalid" : "offline", true);
		}
	};

	useEffect(() => {
		const parsed = parseGroupFragment(window.location.hash);
		// Keep the key out of the address bar and session history once read.
		if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
		link.current = parsed;
		if (!parsed) return fail("invalid");
		if (parsed.needsPassphrase) return setState({ step: "passphrase" });
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

	const restore = (found: Extract<State, { step: "found" }>) => {
		const { groups, added } = mergeRestored(loadGroupsFromStorage(), found.groups, MAX_GROUPS);
		saveGroupsToStorage(groups);
		// This device keeps backing up to the same link, unless it already has a backup of its own.
		if (!loadBackup()) storeBackup({ link: found.link });
		track("backup_restored", { groups: added });
		router.replace("/dashboard");
	};

	return (
		<div className="mx-auto max-w-md px-4 py-16">
			{state.step === "opening" && (
				<p className="flex items-center justify-center gap-2 text-ink-muted" aria-live="polite">
					<Loader2 className="h-4 w-4 animate-spin" />
					Decrypting your backup…
				</p>
			)}

			{state.step === "passphrase" && (
				<form onSubmit={submitPassphrase} className="surface p-6">
					<span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
						<KeyRound className="h-5 w-5" />
					</span>
					<h1 className="mt-4 font-display text-2xl font-semibold text-ink">Enter your backup passphrase</h1>
					<p className="mt-1 text-ink-muted">You chose a passphrase when you turned on the backup.</p>
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
							That passphrase doesn&apos;t open this backup.
						</p>
					)}
					<button type="submit" disabled={!passphrase || working} className="btn-primary mt-4 w-full !py-3">
						{working ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
						{working ? "Unlocking…" : "Open backup"}
					</button>
				</form>
			)}

			{state.step === "found" && (
				<div className="surface ph-no-capture p-6" data-ph-no-capture>
					<span className="flex h-11 w-11 items-center justify-center rounded-full bg-positive-soft text-positive">
						<ShieldCheck className="h-5 w-5" />
					</span>
					<h1 className="mt-4 font-display text-2xl font-semibold text-ink">Found {plural(state.groups.length)}</h1>
					<ul className="mt-3 divide-y divide-line rounded-xl border border-line">
						{state.groups.map((g) => (
							<li key={g.id} className="truncate px-3.5 py-2.5 text-ink">{g.name}</li>
						))}
					</ul>
					<p className="mt-3 text-sm text-ink-muted">Groups already on this device stay as they are. Shared groups catch up with everyone&apos;s latest changes.</p>
					<button type="button" onClick={() => restore(state)} disabled={!state.groups.length} className="btn-primary mt-4 w-full !py-3">
						Add them to this device
					</button>
				</div>
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
