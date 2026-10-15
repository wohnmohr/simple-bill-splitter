"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Share2, Users } from "lucide-react";
import { UpiQr, useCanOpenUpiApps } from "@/components/Settlements/UpiQr";
import { track } from "@/lib/analytics";
import { personKey, tally } from "@/utils/billClaims";
import { billToGroup } from "@/utils/billGroup";
import type { PayRequest } from "@/utils/payStory";
import type { CloudEntry } from "@/utils/splitCloud";
import { isOrganiser } from "@/utils/splitOrganiser";
import { IMPORT_LIMIT_MESSAGE, importShareSnapshot } from "@/utils/shareImport";
import { buildUpiLink } from "@/utils/upi";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const sameList = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Remembers on this device which name you claimed under, per split. Never sent anywhere. */
const nameKey = (path: string) => `splitbiller-claim-name:${path}`;
const readName = (path: string) => {
	try {
		return localStorage.getItem(nameKey(path)) ?? "";
	} catch {
		return "";
	}
};
const keepName = (path: string, name: string) => {
	try {
		localStorage.setItem(nameKey(path), name);
	} catch {
		/* storage blocked: they'll type their name again next time */
	}
};

type Props = {
	id: string;
	req: PayRequest;
	/** Shows `next` at once and saves `entry`; resolves false if saving failed. */
	append: (next: PayRequest, entry: CloudEntry) => Promise<boolean>;
	expiresAt: number;
};

/**
 * An itemised bill shared with the table. Each friend ticks what they had and
 * sees their exact share, taxes and fees included, then pays by UPI. Everyone
 * sees who has claimed and paid, live.
 */
export const ClaimView = ({ id, req, append, expiresAt }: Props) => {
	const items = req.items!;
	const claims = req.claims ?? [];
	const path = `/s/${id}`;
	const [organiser] = useState(() => isOrganiser(path));
	const [me, setMe] = useState(() => (organiser ? req.name : readName(path)));
	/** Ticks since the last save; null follows what's saved. */
	const [picks, setPicks] = useState<number[] | null>(null);
	const [paying, setPaying] = useState(false);
	const [copied, setCopied] = useState(false);
	const [saving, setSaving] = useState(false);
	const nameInput = useRef<HTMLInputElement>(null);
	const canOpenApps = useCanOpenUpiApps();

	useEffect(() => {
		track("bill_link_opened", { role: organiser ? "organiser" : "visitor", items: items.length, claims: claims.length });
		// eslint-disable-next-line react-hooks/exhaustive-deps -- count the open, not later updates
	}, []);

	const myKey = personKey(me);
	const board = tally({ ...req, items, claims });
	const saved = board.diners.find((d) => personKey(d.name) === myKey);
	const selection = picks ?? saved?.items ?? [];
	const dirty = !sameList(selection, saved?.items ?? []);
	// What you'd owe with these ticks, worked out exactly as the board will once saved.
	const preview = useMemo(
		() => (myKey ? tally({ ...req, items, claims: [...claims, [me.trim(), selection]] }).diners.find((d) => personKey(d.name) === myKey) : undefined),
		[req, items, claims, me, myKey, selection]
	);
	const share = preview?.share ?? 0;
	const takenByOrganiser = !organiser && myKey !== "" && myKey === personKey(req.name);
	const iPaid = saved?.paid ?? false;
	const friends = board.diners.filter((d) => !d.organiser);
	const upi = share >= 1 ? buildUpiLink({ pa: req.upiId, pn: req.name, am: share, tn: req.title }) : null;

	const toggle = (i: number) => setPicks(selection.includes(i) ? selection.filter((x) => x !== i) : [...selection, i].sort((a, b) => a - b));

	const save = async () => {
		const name = me.trim().slice(0, 30);
		if (!name || takenByOrganiser) return nameInput.current?.focus();
		setSaving(true);
		const ok = await append({ ...req, claims: [...claims, [name, selection]] }, { kind: "claim", data: [name, selection] });
		setSaving(false);
		if (!ok) return;
		keepName(path, name);
		setPicks(null);
		track("bill_items_claimed", { role: organiser ? "organiser" : "visitor", items: selection.length, of: items.length });
	};

	const markPaid = (name: string, amount: number, by: "payer" | "organiser") => {
		if (amount < 1) return;
		void append({ ...req, paid: [...req.paid, [name, amount]] }, { kind: "payment", data: [name, amount] });
		track("bill_payment_marked", { by, completes: board.collected + amount >= req.target });
		setPaying(false);
	};

	const shareLink = async () => {
		const url = window.location.href;
		const text = `${req.title}: tap what you ate and pay your share. Taxes and fees are worked in.`;
		const done = (method: "native" | "copy") => track("split_link_shared", { template: "bill", storage: "cloud", method, done: board.done });
		if (navigator.share) {
			try {
				await navigator.share({ title: req.title, text, url });
				return done("native");
			} catch {
				/* cancelled: fall through to copy */
			}
		}
		try {
			await navigator.clipboard?.writeText(`${text} ${url}`);
			done("copy");
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* clipboard blocked */
		}
	};

	const [groupError, setGroupError] = useState("");
	/** Carries the table into the app as a group (on this device), and opens it there. */
	const saveAsGroup = () => {
		const { snapshot, meId } = billToGroup(req, board);
		const result = importShareSnapshot(snapshot, meId);
		if (!result.ok) return setGroupError(result.reason === "limit" ? IMPORT_LIMIT_MESSAGE : "Nobody has picked items yet.");
		track("bill_saved_as_group", { members: snapshot.members.length, payments: snapshot.expenses.length - 1, done: board.done });
		window.location.assign("/dashboard");
	};

	const progress = Math.min(board.collected / req.target, 1);

	return (
		<div className="mx-auto max-w-xl px-4 pb-40 pt-6 sm:pt-10">
			<header>
				<p className="text-sm text-ink-muted">🧾 Bill from {req.name}</p>
				<h1 className="mt-1 font-display text-3xl font-semibold text-ink [text-wrap:balance]">{req.title}</h1>
				<p className="mt-1 text-ink-soft">
					{organiser ? "Share the link, then tick what you had too." : "Tick what you had. Your share includes taxes and fees."}
				</p>
			</header>

			{/* The live board: what's claimed, what's paid. */}
			<section aria-label="Progress" className="surface mt-5 p-4">
				<div className="flex items-baseline justify-between gap-3">
					<p className="font-semibold tabular-nums text-ink">
						{inr(board.collected)} <span className="font-normal text-ink-muted">of {inr(req.target)} collected</span>
					</p>
					<span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
						<span className="h-2 w-2 animate-pulse rounded-full bg-positive" aria-hidden />
						Live
					</span>
				</div>
				<div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-50" role="progressbar" aria-label="Collected" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
					<div className="h-full rounded-full bg-positive transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
				</div>
				<p className="mt-2 text-sm text-ink-soft" aria-live="polite">
					{board.done
						? "Everything’s claimed and paid 🎉"
						: `${board.claimedItems} of ${items.length} items claimed · ${friends.filter((d) => d.paid).length} of ${friends.length} ${friends.length === 1 ? "friend" : "friends"} paid`}
					{board.unclaimed > 0 && board.claimedItems > 0 && <span className="text-ink-muted"> · {inr(board.unclaimed)} unclaimed</span>}
				</p>
			</section>

			{organiser && (
				<button type="button" onClick={shareLink} className="btn-primary mt-4 w-full !justify-center !py-3">
					<Share2 className="h-4 w-4" />
					{copied ? "Link copied" : "Send the link to the table"}
				</button>
			)}

			<label className="mt-6 block">
				<span className="text-[13px] font-semibold text-ink-soft">{organiser ? "You" : "Your name"}</span>
				<input
					ref={nameInput}
					value={me}
					maxLength={30}
					readOnly={organiser}
					onChange={(e) => {
						setMe(e.target.value);
						setPicks(null);
					}}
					placeholder="Your first name"
					autoComplete="given-name"
					className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-base text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 read-only:bg-paper"
				/>
				{takenByOrganiser ? (
					<span role="alert" className="mt-1 block text-sm text-negative">That’s the organiser’s name. Add an initial so we can tell you apart.</span>
				) : (
					saved && !dirty && <span className="mt-1 block text-sm text-ink-muted">You picked {saved.items.length} {saved.items.length === 1 ? "item" : "items"}. Tap to change.</span>
				)}
			</label>

			<section aria-labelledby="bill-items" className="mt-5">
				<h2 id="bill-items" className="mb-2 text-[13px] font-semibold text-ink-soft">What did you have?</h2>
				<ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
					{items.map(([name, amount], i) => {
						const on = selection.includes(i);
						const others = board.claimers[i].filter((n) => personKey(n) !== myKey);
						const sharers = others.length + (on ? 1 : 0);
						return (
							<li key={i}>
								<button
									type="button"
									role="checkbox"
									aria-checked={on}
									onClick={() => toggle(i)}
									className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${on ? "bg-brand-50" : "hover:bg-paper"}`}
								>
									<span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong"}`} aria-hidden>
										{on && <Check className="h-4 w-4" strokeWidth={3} />}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-medium text-ink">{name || `Item ${i + 1}`}</span>
										{(others.length > 0 || sharers > 1) && (
											<span className="block truncate text-xs text-ink-muted">
												{[...(on ? ["You"] : []), ...others].join(", ")}
												{sharers > 1 && ` · split ${sharers} ways`}
											</span>
										)}
									</span>
									<span className="shrink-0 text-right tabular-nums text-ink">
										{inr(amount)}
										{on && sharers > 1 && <span className="block text-xs text-ink-muted">{inr(Math.round((amount / sharers) * 100) / 100)} each</span>}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			</section>

			{board.diners.length > 0 && (
				<section aria-labelledby="bill-diners" className="mt-6">
					<h2 id="bill-diners" className="mb-2 text-[13px] font-semibold text-ink-soft">Who’s in</h2>
					<ul className="divide-y divide-line rounded-xl border border-line bg-surface">
						{board.diners.map((d) => (
							<li key={d.name} className="flex items-center gap-3 px-3 py-2.5">
								<span className="min-w-0 flex-1">
									<span className="block truncate font-medium text-ink">
										{d.name}
										{personKey(d.name) === myKey && <span className="font-normal text-ink-muted"> (you)</span>}
									</span>
									<span className="block text-xs text-ink-muted">
										{d.items.length} {d.items.length === 1 ? "item" : "items"} · {inr(d.share)}
									</span>
								</span>
								{d.organiser ? (
									<span className="text-xs text-ink-muted">Paid the bill</span>
								) : d.paid ? (
									<span className="inline-flex items-center gap-1 text-sm font-semibold text-positive"><Check className="h-4 w-4" /> Paid</span>
								) : organiser ? (
									<button type="button" onClick={() => markPaid(d.name, d.share, "organiser")} className="btn-secondary !py-1.5 text-sm">Received ✓</button>
								) : (
									<span className="text-sm text-ink-muted">Not yet</span>
								)}
							</li>
						))}
					</ul>
				</section>
			)}

			{organiser && friends.length > 0 && (
				<section aria-labelledby="bill-group" className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4">
					<h2 id="bill-group" className="flex items-center gap-2 font-semibold text-ink">
						<Users className="h-4 w-4 text-brand-700" /> Keep splitting with this table
					</h2>
					<p className="mt-1 text-sm text-ink-soft">
						Save it as a group: everyone here becomes a member, with this bill and who’s paid already in it. Turn on sync there to share
						the group, and the next bill takes seconds.
					</p>
					<button type="button" onClick={saveAsGroup} className="btn-secondary mt-3 w-full !justify-center">
						Save as a group
					</button>
					{groupError && <p role="alert" className="mt-2 text-sm text-negative">{groupError}</p>}
				</section>
			)}

			<p className="mt-6 text-xs text-ink-muted">
				🔒 End-to-end encrypted · updates live for everyone with the link · deleted automatically on{" "}
				{new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Paying <b>{req.upiId}</b>: check your UPI app shows{" "}
				<b>{req.name}</b> before you confirm. Payments are on trust: UPI doesn’t confirm them.
			</p>

			{/* Your share and what to do next, always in reach. */}
			<div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
				<div className="mx-auto max-w-xl">
					<div className="flex items-baseline justify-between gap-3">
						<span className="text-sm text-ink-soft">{organiser ? "Your part" : "Your share"}</span>
						<span className="font-display text-2xl font-semibold tabular-nums text-ink" aria-live="polite">{inr(share)}</span>
					</div>
					{preview && share > 0 && (
						<p className="text-right text-xs tabular-nums text-ink-muted">
							items {inr(preview.own)} {share >= preview.own ? "+" : "−"} taxes, fees and discounts {inr(Math.abs(Math.round((share - preview.own) * 100) / 100))}
						</p>
					)}
					<div className="mt-2">
						{dirty || !saved ? (
							<button type="button" onClick={save} disabled={saving || (!dirty && !saved) || (selection.length === 0 && !saved)} className="btn-primary w-full !justify-center !py-3 disabled:opacity-50">
								{saving ? "Saving…" : !me.trim() ? "Add your name to save" : selection.length === 0 ? (saved ? "Remove me from the bill" : "Tick what you had") : saved ? "Update my items" : "These are mine"}
							</button>
						) : organiser ? (
							<p className="py-2 text-center text-sm text-ink-soft">You paid the bill, so your part is settled.</p>
						) : iPaid ? (
							<p className="py-2 text-center text-sm font-semibold text-positive">✓ You’re marked paid. Thanks!</p>
						) : paying || canOpenApps === false ? (
							<div className="space-y-2">
								{canOpenApps === false && upi && (
									<div className="flex items-center gap-3">
										<UpiQr link={upi} label={`UPI QR to pay ${inr(share)} to ${req.name}`} className="h-24 w-24 shrink-0" />
										<p className="text-sm text-ink-soft">Scan with any UPI app to pay {inr(share)} to {req.name}.</p>
									</div>
								)}
								<button type="button" onClick={() => saved && markPaid(saved.name, share, "payer")} className="btn-primary w-full !justify-center !py-3">
									I’ve paid {inr(share)} ✓
								</button>
							</div>
						) : (
							<a
								href={upi ?? undefined}
								onClick={() => {
									setPaying(true);
									track("upi_pay_link_clicked", { source: "bill", template: "bill", storage: "cloud", mode: "items" });
								}}
								className="btn-primary w-full !justify-center !py-3"
							>
								Pay {inr(share)} with UPI
							</a>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
