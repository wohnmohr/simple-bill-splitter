"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/UI/Modal";
import { MIN_PASSPHRASE, PassphraseField } from "@/components/Group/SyncModal";
import type { useBackup } from "@/hooks/useBackup";
import { recoveryUrl } from "@/utils/groupBackup";
import { sendViaWhatsApp } from "@/utils/whatsapp";
import { track } from "@/lib/analytics";

type Backup = ReturnType<typeof useBackup>;

const when = (at?: number) =>
	at ? new Date(at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";

/** The recovery link, and the ways to keep it somewhere other than this phone. */
const RecoveryLink = ({ url, hasPass }: { url: string; hasPass: boolean }) => {
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			track("backup_link_saved", { method: "copy" });
		} catch {
			/* clipboard blocked: the field can still be selected */
		}
	};
	const toWhatsApp = async () => {
		const text = `My SplitBiller recovery link. Open it on a new phone to get my groups back. Keep it private: ${url}`;
		if ((await sendViaWhatsApp(text)) === "copied") setCopied(true);
		track("backup_link_saved", { method: "whatsapp" });
	};
	return (
		<div>
			<label className="label-text" htmlFor="recovery-link">Your recovery link</label>
			<div className="mt-1.5 flex gap-2">
				<input id="recovery-link" readOnly value={url} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 truncate rounded-xl border border-line-strong bg-paper px-3 py-2.5 text-sm text-ink-soft" />
				<button type="button" onClick={copy} className="btn-secondary shrink-0" aria-label="Copy recovery link">
					{copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
					{copied ? "Copied" : "Copy"}
				</button>
			</div>
			<button type="button" onClick={toWhatsApp} className="btn-primary mt-2 w-full">Send it to myself on WhatsApp</button>
			<p className="mt-2 text-sm text-ink-soft">
				Or keep it in your password manager. Anyone with this link{hasPass ? " and your passphrase" : ""} can open your groups, so don&apos;t share it.
			</p>
		</div>
	);
};

/**
 * "Keep my groups safe": an opt-in, end-to-end encrypted backup of this
 * device's groups, opened again with a recovery link only its owner holds.
 */
export const BackupCard = ({ backup }: { backup: Backup }) => {
	const [open, setOpen] = useState(false);
	const [usePass, setUsePass] = useState(false);
	const [passphrase, setPassphrase] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const state = backup.backup;
	const passOk = !usePass || passphrase.length >= MIN_PASSPHRASE;

	const run = async (job: () => Promise<unknown>, failMessage: string) => {
		setBusy(true);
		setError("");
		try {
			await job();
			setUsePass(false);
			setPassphrase("");
		} catch {
			setError(failMessage);
		} finally {
			setBusy(false);
		}
	};

	const turnOn = () => run(() => backup.turnOn(usePass ? passphrase : undefined), "Couldn't turn on the backup. Check your connection and try again.");
	const turnOff = () =>
		run(async () => {
			await backup.turnOff();
			setOpen(false);
		}, "Couldn't delete the backup. Check your connection and try again.");

	const status = !state
		? "Only on this phone. Clearing the browser or changing phones loses them."
		: state.gone
		? "Your backup was deleted after 6 months unused. Turn it on again."
		: backup.failed
		? "Offline. Your groups will back up when you're back."
		: `Backed up, end-to-end encrypted${state.savedAt ? ` · ${when(state.savedAt)}` : ""}`;
	const on = state && !state.gone;

	return (
		<>
			<section className="surface mt-4 flex items-start gap-3 p-4" aria-labelledby="backup-card-title">
				<span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${on ? "bg-positive-soft text-positive" : "bg-brand-50 text-brand-700"}`} aria-hidden>
					{on ? <ShieldCheck className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
				</span>
				<div className="min-w-0 flex-1">
					<h2 id="backup-card-title" className="font-semibold text-ink">
						{on ? "Your groups are backed up" : "Keep your groups safe"}
					</h2>
					<p className="mt-0.5 text-sm text-ink-muted">{status}</p>
					<button
						type="button"
						onClick={() => {
							setOpen(true);
							if (!on) track("backup_card_opened");
						}}
						className="btn-secondary mt-3 !py-2"
					>
						{on ? "Recovery link" : "Back up my groups"}
					</button>
				</div>
			</section>

			<Modal isOpen={open} onClose={() => setOpen(false)} title={on ? "Your backup" : "Keep your groups safe"}>
				<div className="ph-no-capture flex flex-col gap-4 pb-2" data-ph-no-capture>
					{!on ? (
						<>
							<p className="text-ink-soft">
								Back up every group on this phone, so you can get them back on a new phone or after clearing your browser.
							</p>
							<ul className="space-y-2.5 text-sm text-ink-soft">
								<li className="flex gap-2.5">
									<Lock className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
									<span>
										<b className="text-ink">End-to-end encrypted.</b> The key is in your recovery link and never reaches our server. We can&apos;t see names, amounts or UPI IDs, or even how many groups you have.
									</span>
								</li>
								<li className="flex gap-2.5">
									<Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
									<span>Every change backs up by itself. Turn it off any time and the backup is deleted.</span>
								</li>
								<li className="flex gap-2.5">
									<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-negative" />
									<span>
										<b className="text-ink">Only you hold the key.</b> If you lose both this phone and the recovery link, nobody can bring your groups back, not even us.
									</span>
								</li>
							</ul>
							<PassphraseField
								on={usePass}
								setOn={setUsePass}
								value={passphrase}
								setValue={setPassphrase}
								hint="Then the recovery link alone opens nothing. You'll need both to restore."
							/>
							{error && <p role="alert" className="text-sm text-negative">{error}</p>}
							<button type="button" onClick={turnOn} disabled={busy || !passOk} className="btn-primary w-full !py-3">
								{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
								{busy ? "Encrypting…" : "Turn on backup"}
							</button>
						</>
					) : (
						<>
							<p role="status" className="flex items-center gap-2 text-sm text-ink-soft">
								<ShieldCheck className="h-4 w-4 text-positive" />
								{status}
							</p>
							<RecoveryLink url={recoveryUrl(state.link)} hasPass={Boolean(state.link.pass)} />
							{error && <p role="alert" className="text-sm text-negative">{error}</p>}
							<button type="button" onClick={turnOff} disabled={busy} className="btn-ghost w-full text-negative">
								{busy && <Loader2 className="h-4 w-4 animate-spin" />}
								Turn off and delete the backup
							</button>
						</>
					)}
				</div>
			</Modal>
		</>
	);
};
