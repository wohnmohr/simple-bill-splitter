"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Copy, KeyRound, Loader2, Lock, QrCode, RefreshCw, Share2, Trash2, Unlink } from "lucide-react";
import { Modal } from "@/components/UI/Modal";
import { ReportProblem } from "@/components/Feedback/ReportProblem";
import type { Group } from "@/types";
import type { SyncStatus } from "@/utils/groupSync";
import { groupUrl, syncShareText } from "@/utils/groupSync";
import { deriveGroupKeys } from "@/utils/groupVault";
import { track } from "@/lib/analytics";
import { sendViaWhatsApp } from "@/utils/whatsapp";
import { AlertsToggle } from "@/components/Group/AlertsToggle";
import { UpiQr } from "@/components/Settlements/UpiQr";

export const MIN_PASSPHRASE = 6;

type Props = {
	isOpen: boolean;
	onClose: () => void;
	group: Group;
	status?: SyncStatus;
	expiresAt?: number;
	onEnable: (group: Group, passphrase?: string) => Promise<unknown>;
	onResetLink: (group: Group, passphrase?: string) => Promise<unknown>;
	onDeleteForEveryone: (group: Group) => Promise<void>;
	onKeepLocal: (groupId: string) => void;
};

const STATUS_TEXT: Record<SyncStatus, string> = {
	synced: "Synced",
	syncing: "Syncing…",
	offline: "Offline. Changes are saved and will sync when you're back.",
	gone: "This link was reset or the group was deleted.",
	locked: "This device's key no longer opens the group.",
};

/** Optional passphrase: a leaked link alone then opens nothing. */
export const PassphraseField = ({
	on,
	setOn,
	value,
	setValue,
	hint = "Then the link alone opens nothing. Tell people the passphrase in person or on a call, not in the same chat as the link.",
}: { on: boolean; setOn: (v: boolean) => void; value: string; setValue: (v: string) => void; hint?: string }) => (
	<div className="rounded-xl border border-line p-3">
		<label className="flex cursor-pointer items-start gap-3">
			<input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="mt-1 h-4 w-4 accent-brand-700" />
			<span>
				<span className="block text-sm font-semibold text-ink">Also require a passphrase</span>
				<span className="block text-sm text-ink-muted">{hint}</span>
			</span>
		</label>
		{on && (
			<input
				type="password"
				autoComplete="new-password"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder={`At least ${MIN_PASSPHRASE} characters`}
				className="mt-3 w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-base text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
			/>
		)}
	</div>
);

export const SyncModal = ({ isOpen, onClose, group, status, expiresAt, onEnable, onResetLink, onDeleteForEveryone, onKeepLocal }: Props) => {
	const [usePass, setUsePass] = useState(false);
	const [passphrase, setPassphrase] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);
	const [copiedMine, setCopiedMine] = useState(false);
	const me = group.meId ? group.members.find((m) => m.id === group.meId) : undefined;
	/** Your personal link: your other devices open the group as you instead of joining again. */
	const copyMine = async () => {
		if (!sync || !me) return;
		try {
			await navigator.clipboard.writeText(groupUrl(sync, me.id));
			setCopiedMine(true);
			setTimeout(() => setCopiedMine(false), 2000);
			track("group_personal_link_copied");
		} catch {
			/* clipboard blocked; nothing else to do */
		}
	};
	const [confirm, setConfirm] = useState<null | "reset" | "delete">(null);
	const [safetyCode, setSafetyCode] = useState("");
	const [details, setDetails] = useState(false);
	const [showQr, setShowQr] = useState(false);

	const sync = group.sync;
	const url = sync && typeof window !== "undefined" ? groupUrl(sync) : "";
	const passOk = !usePass || passphrase.length >= MIN_PASSPHRASE;

	useEffect(() => {
		let live = true;
		setSafetyCode("");
		if (sync) void deriveGroupKeys(sync.secret, sync.pass).then((k) => live && setSafetyCode(k.safetyCode));
		return () => {
			live = false;
		};
	}, [sync]);

	useEffect(() => {
		if (!isOpen) {
			setConfirm(null);
			setError("");
			setPassphrase("");
			setUsePass(false);
			setShowQr(false);
		}
	}, [isOpen]);

	const run = async (job: () => Promise<unknown>, failMessage: string) => {
		setBusy(true);
		setError("");
		try {
			await job();
			setConfirm(null);
			setPassphrase("");
			setUsePass(false);
		} catch {
			setError(failMessage);
		} finally {
			setBusy(false);
		}
	};

	const enable = () =>
		run(async () => {
			await onEnable(group, usePass ? passphrase : undefined);
			track("group_sync_enabled", { passphrase: usePass, members: group.members.length });
		}, "Couldn't turn on sync. Check your connection and try again.");

	const reset = () =>
		run(async () => {
			await onResetLink(group, usePass ? passphrase : undefined);
			track("group_link_reset", { passphrase: usePass });
		}, "Couldn't reset the link. Check your connection and try again.");

	const destroy = () =>
		run(async () => {
			await onDeleteForEveryone(group);
			track("group_deleted_for_everyone");
			onClose();
		}, "Couldn't delete the group. Check your connection and try again.");

	const share = async (method: "native" | "copy" | "whatsapp") => {
		const text = syncShareText(group, url) + (sync?.pass ? " (I'll tell you the passphrase.)" : "");
		if (method === "whatsapp") {
			if ((await sendViaWhatsApp(text)) === "copied") {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}
		}
		else if (method === "native" && navigator.share) {
			try {
				await navigator.share({ title: group.name, text, url });
			} catch {
				return;
			}
		} else {
			try {
				await navigator.clipboard.writeText(url);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} catch {
				return;
			}
		}
		track("group_sync_link_shared", { method, passphrase: Boolean(sync?.pass) });
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={sync ? "Shared group" : "Share & sync"}>
			<div className="ph-no-capture flex flex-col gap-4 pb-2" data-ph-no-capture>
				{!sync ? (
					<>
						<p className="text-ink-soft">
							Everyone you share the link with can see the group and add expenses from their own phone. It stays in sync.
						</p>
						<ul className="space-y-2.5 text-sm text-ink-soft">
							<li className="flex gap-2.5">
								<Lock className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
								<span>
									<b className="text-ink">End-to-end encrypted.</b> The key is in the link and never reaches our server, which only stores ciphertext it can&apos;t read.
								</span>
							</li>
							<li className="flex gap-2.5">
								<Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
								<span>
									<b className="text-ink">No sign-up.</b> Anyone with the link can view and add, so share it only with the group.
								</span>
							</li>
							<li className="flex gap-2.5">
								<Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
								<span>Deleted from our server after 6 months without changes, or whenever you choose.</span>
							</li>
						</ul>
						<PassphraseField on={usePass} setOn={setUsePass} value={passphrase} setValue={setPassphrase} />
						{error && <p role="alert" className="text-sm text-negative">{error}</p>}
						<button type="button" onClick={enable} disabled={busy || !passOk} className="btn-primary w-full !py-3">
							{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
							{busy ? "Encrypting…" : "Turn on sync"}
						</button>
					</>
				) : status === "gone" || status === "locked" ? (
					<>
						<p role="status" className="rounded-xl bg-negative-soft px-3 py-2.5 text-sm text-negative">{STATUS_TEXT[status]}</p>
						<p className="text-sm text-ink-soft">
							Your copy is still on this device. Ask someone in the group for the new link, or keep this copy as a group only you can see.
						</p>
						<button type="button" onClick={() => { onKeepLocal(group.id); onClose(); }} className="btn-primary w-full">
							Keep my copy on this device
						</button>
						<ReportProblem problem={`sync_${status}`} className="self-center" />
					</>
				) : (
					<>
						<p role="status" className="flex items-center gap-2 text-sm text-ink-soft">
							<Lock className="h-4 w-4 text-positive" />
							End-to-end encrypted · {STATUS_TEXT[status ?? "syncing"]}
						</p>

						<div>
							<label className="label-text" htmlFor="group-link">Group link</label>
							<div className="mt-1.5 flex gap-2">
								<input id="group-link" readOnly value={url} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 truncate rounded-xl border border-line-strong bg-paper px-3 py-2.5 text-sm text-ink-soft" />
								<button type="button" onClick={() => share("copy")} className="btn-secondary shrink-0" aria-label="Copy link">
									{copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
									{copied ? "Copied" : "Copy"}
								</button>
							</div>
							<div className="mt-2 grid grid-cols-2 gap-2">
								<button type="button" onClick={() => share("whatsapp")} className="btn-primary">Share on WhatsApp</button>
								<button type="button" onClick={() => share("native")} className="btn-secondary">
									<Share2 className="h-4 w-4" />
									More
								</button>
							</div>
							{showQr ? (
								<div className="mt-3 flex flex-col items-center gap-2 rounded-xl bg-paper p-4 text-center">
									<UpiQr link={url} label="QR code of the group link" className="h-52 w-52" />
									<p className="text-sm text-ink-soft">Friends next to you scan this with their phone camera to join.</p>
								</div>
							) : (
								<button
									type="button"
									onClick={() => {
										setShowQr(true);
										track("group_qr_shown");
									}}
									className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
								>
									<QrCode className="h-4 w-4" />
									Show a QR code for people nearby
								</button>
							)}
							{sync.pass && (
								<p className="mt-2 flex gap-2 text-sm text-ink-soft">
									<KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
									Passphrase protected. Tell people the passphrase separately; it isn&apos;t in the link.
								</p>
							)}
						</div>

						<AlertsToggle group={group} />

						{me && (
							<div className="rounded-xl border border-line p-3">
								<p className="label-text">Your other devices</p>
								<p className="mt-1 text-sm text-ink-muted">
									Open the group as <b className="font-semibold text-ink">{me.name}</b> on your laptop or another phone, so you
									don&apos;t join twice. Keep this link to yourself.
								</p>
								<button type="button" onClick={copyMine} className="btn-secondary mt-2 w-full">
									{copiedMine ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
									{copiedMine ? "Copied" : "Copy my link"}
								</button>
							</div>
						)}

						{safetyCode && (
							<div className="rounded-xl bg-paper p-3">
								<p className="label-text">Safety code</p>
								<p className="mt-1 text-2xl tracking-wide" aria-label={`Safety code ${safetyCode}`}>{safetyCode}</p>
								<p className="mt-1 text-sm text-ink-muted">
									Everyone in this group sees the same five emoji. Different emoji means a different link, so check with each other once.
								</p>
							</div>
						)}

						<button type="button" onClick={() => setDetails((d) => !d)} aria-expanded={details} className="inline-flex items-center gap-1 self-start text-sm text-ink-muted hover:text-ink">
							<ChevronDown className={`h-4 w-4 transition-transform ${details ? "rotate-180" : ""}`} />
							What our server can and can&apos;t see
						</button>
						{details && (
							<div className="space-y-2 rounded-xl bg-paper p-3 text-sm text-ink-soft">
								<p><b className="text-ink">Can&apos;t see:</b> the group name, members, UPI IDs, amounts, descriptions, or who added what. All of it is encrypted on your phone with a key that only exists in the link.</p>
								<p><b className="text-ink">Can see:</b> that an encrypted group exists, roughly how big it is (sizes are padded), and when changes arrive. Like any website, it sees your IP address when you connect; we don&apos;t store it with the group. If you turn on alerts, it also keeps this device&apos;s push address with the group, so it can say &ldquo;something changed&rdquo; and nothing more.</p>
								<p><b className="text-ink">Anyone with the link</b>{sync.pass ? " and the passphrase" : ""} can read and edit the group. To remove someone, reset the link.</p>
								{expiresAt && <p>Deleted from our server on {new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} unless the group changes before then.</p>}
							</div>
						)}

						{error && <p role="alert" className="text-sm text-negative">{error}</p>}

						<div className="border-t border-line pt-3">
							{confirm === "reset" ? (
								<div className="space-y-3">
									<p className="text-sm text-ink-soft">
										The group moves to a new link and the old one stops working. People with the old link keep what they already have but won&apos;t see anything new. Share the new link with everyone who should stay.
									</p>
									<PassphraseField on={usePass} setOn={setUsePass} value={passphrase} setValue={setPassphrase} />
									<div className="grid grid-cols-2 gap-2">
										<button type="button" onClick={() => setConfirm(null)} className="btn-secondary">Cancel</button>
										<button type="button" onClick={reset} disabled={busy || !passOk} className="btn-primary">
											{busy && <Loader2 className="h-4 w-4 animate-spin" />}
											Reset link
										</button>
									</div>
								</div>
							) : confirm === "delete" ? (
								<div className="space-y-3">
									<p className="text-sm text-ink-soft">
										Deletes the encrypted group from our server. Everyone&apos;s copy stops syncing; copies already on phones stay there. This can&apos;t be undone.
									</p>
									<div className="grid grid-cols-2 gap-2">
										<button type="button" onClick={() => setConfirm(null)} className="btn-secondary">Cancel</button>
										<button type="button" onClick={destroy} disabled={busy} className="btn-primary !bg-negative hover:!bg-negative/90">
											{busy && <Loader2 className="h-4 w-4 animate-spin" />}
											Delete for everyone
										</button>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-start gap-1">
									<button type="button" onClick={() => setConfirm("reset")} className="btn-ghost">
										<RefreshCw className="h-4 w-4" />
										Remove someone (reset link)
									</button>
									<button type="button" onClick={() => { onKeepLocal(group.id); onClose(); }} className="btn-ghost">
										<Unlink className="h-4 w-4" />
										Stop syncing on this device
									</button>
									<button type="button" onClick={() => setConfirm("delete")} className="btn-ghost !text-negative">
										<Trash2 className="h-4 w-4" />
										Delete for everyone
									</button>
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</Modal>
	);
};
