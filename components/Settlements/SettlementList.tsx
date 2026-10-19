"use client";

import { useEffect, useState } from "react";
import { Settlement, Person, Currency, Expense, GroupSyncLink } from "@/types";
import { MemberAvatar } from "@/components/Group/MemberAvatar";
import { formatCurrency } from "@/utils/formatting";
import { ArrowRight, Check, CircleCheck, MessageCircle } from "lucide-react";
import { ShareSettlementActions } from "@/components/Share/ShareSettlementActions";
import { UpiSettlementActions } from "@/components/Settlements/UpiSettlementActions";
import { groupUrl } from "@/utils/groupSync";
import { buildShareSnapshot, encodeShareUrl } from "@/utils/shareCodec";
import { track, trackError } from "@/lib/analytics";
import { oweMessage, sendViaWhatsApp } from "@/utils/whatsapp";

interface SettlementListProps {
	settlements: Settlement[];
	people: Person[];
	currency: Currency;
	groupName?: string;
	expenses?: Expense[];
	/** Allow adding/editing UPI IDs from settlement cards */
	onUpdateMemberUpi?: (personId: string, upiId: string) => void;
	/** Who is holding this device. undefined = not asked, null = just viewing.
	 * With onSetMe but no onRecordPayment (a shared link), it shows "you pay X" first without the ledger buttons. */
	meId?: string | null;
	onSetMe?: (personId: string | null | undefined) => void;
	onRecordPayment?: (settlement: Settlement) => void;
	/** Shown under the "settled" finish, e.g. a request for a review. */
	settledSlot?: React.ReactNode;
	/** Names for share links when `people` carries this device's private nicknames. */
	sharePeople?: Person[];
	/** The group's sync link, when it's shared: reminders then bring people into the group itself. */
	syncLink?: GroupSyncLink;
}

type Pending = { from: string; to: string; amount: number };

const sameSettlement = (a: Pending | null, s: Settlement) =>
	!!a && a.from === s.from && a.to === s.to && Math.abs(a.amount - s.amount) < 0.01;

export const SettlementList = ({
	settlements,
	people,
	currency,
	groupName = "Split",
	expenses = [],
	onUpdateMemberUpi,
	meId: storedMeId,
	onSetMe,
	onRecordPayment,
	settledSlot,
	sharePeople = people,
	syncLink,
}: SettlementListProps) => {
	const getPerson = (personId: string) => people.find((p) => p.id === personId);
	// If "you" was removed from the group, ask again rather than guessing.
	const meId =
		storedMeId && !getPerson(storedMeId) ? undefined : storedMeId;
	const getPersonName = (personId: string) =>
		getPerson(personId)?.name || "Unknown";

	const canRecord = !!onRecordPayment;
	const canShare = canRecord && expenses.length > 0 && people.length > 0;
	const showUpi = currency.code === "INR";
	const me = meId ? getPerson(meId) : undefined;
	const paymentCount = expenses.filter((e) => e.kind === "payment").length;

	// A UPI payment the user started from this screen. When they come back from
	// their UPI app we ask whether it went through, instead of assuming.
	const [pending, setPending] = useState<Pending | null>(null);
	const [askConfirm, setAskConfirm] = useState(false);
	// On a computer the reminder lands on the clipboard; this is whose it was.
	const [remindCopied, setRemindCopied] = useState<string | null>(null);

	useEffect(() => {
		if (!pending) return;
		const onReturn = () => {
			if (document.visibilityState === "visible") setAskConfirm(true);
		};
		document.addEventListener("visibilitychange", onReturn);
		window.addEventListener("focus", onReturn);
		return () => {
			document.removeEventListener("visibilitychange", onReturn);
			window.removeEventListener("focus", onReturn);
		};
	}, [pending]);

	// Clear the prompt once that settlement no longer exists (e.g. marked paid).
	useEffect(() => {
		if (pending && !settlements.some((s) => sameSettlement(pending, s))) {
			setPending(null);
			setAskConfirm(false);
		}
	}, [settlements, pending]);

	const markPaid = (s: Settlement, source: string) => {
		onRecordPayment?.(s);
		track("settlement_marked_paid", { source, is_me: s.from === meId || s.to === meId });
	};

	// ── Identity ────────────────────────────────────────────────
	const identityPicker = meId === undefined && onSetMe && (
		<section className="surface p-4 sm:p-5" aria-labelledby="who-are-you">
			<h2 id="who-are-you" className="font-semibold text-ink">
				Which one are you?
			</h2>
			<p className="mt-0.5 text-sm text-ink-muted">
				We&apos;ll put what you owe or are owed first.{canRecord && " Saved on this device only."}
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				{people.map((p) => (
					<button
						key={p.id}
						type="button"
						onClick={() => onSetMe(p.id)}
						className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface py-1 pl-1 pr-4 text-sm font-medium text-ink hover:border-brand-400 hover:bg-brand-50"
					>
						<MemberAvatar person={p} size="sm" />
						{p.name}
					</button>
				))}
				<button
					type="button"
					onClick={() => onSetMe(null)}
					className="rounded-full px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink"
				>
					Just viewing
				</button>
			</div>
		</section>
	);

	const viewingAs = meId !== undefined && onSetMe && (
		<p className="px-1 text-sm text-ink-muted">
			{me ? (
				<>
					Viewing as <span className="font-medium text-ink-soft">{me.name}</span>
				</>
			) : (
				"Viewing everyone's payments"
			)}{" "}
			·{" "}
			<button
				type="button"
				onClick={() => onSetMe(undefined)}
				className="font-medium text-brand-700 hover:underline"
			>
				change
			</button>
		</p>
	);

	// ── Settled ─────────────────────────────────────────────────
	if (settlements.length === 0) {
		const earned = paymentCount > 0;
		return (
			<div className="space-y-4">
				{earned ? (
					<section className="overflow-hidden rounded-2xl bg-brand-800 px-6 py-10 text-center text-on-brand">
						<span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-on-brand/10">
							<Check className="h-6 w-6 text-brand-200" strokeWidth={2.5} />
						</span>
						<h2 className="mt-4 font-display text-3xl font-semibold">
							{groupName} is settled
						</h2>
						<p className="mt-2 text-brand-200">
							{paymentCount === 1
								? "1 payment recorded. Nobody owes anybody."
								: `${paymentCount} payments recorded. Nobody owes anybody.`}
						</p>
					</section>
				) : (
					<div className="surface px-6 py-10 text-center">
						<CircleCheck className="mx-auto h-9 w-9 text-positive" strokeWidth={1.75} />
						<p className="mt-3 font-semibold text-ink">Nothing to settle</p>
						<p className="mt-1 text-sm text-ink-muted">
							Everyone&apos;s share matches what they paid.
						</p>
					</div>
				)}
				{earned && settledSlot}
				{canShare && (
					<section className="surface p-4 sm:p-5">
						<h2 className="font-semibold text-ink">
							{earned ? "Let the group know" : "Share the summary"}
						</h2>
						<p className="mb-4 mt-0.5 text-sm text-ink-muted">
							Everyone gets the same numbers, encrypted in the link.
						</p>
						<ShareSettlementActions
							name={groupName}
							people={sharePeople}
							expenses={expenses}
							currency={currency}
							primary
							source="dashboard"
							syncLink={syncLink}
						/>
					</section>
				)}
			</div>
		);
	}

	// ── Ledger ──────────────────────────────────────────────────
	const mine = me ? settlements.filter((s) => s.from === me.id || s.to === me.id) : [];
	const others = settlements.filter((s) => !mine.includes(s));
	const iAmEven = !!me && mine.length === 0;

	const confirmPrompt = (s: Settlement) =>
		askConfirm && sameSettlement(pending, s) ? (
			<div
				className="mt-3 rounded-xl bg-brand-50 p-3"
				role="alert"
			>
				<p className="text-sm font-medium text-brand-900">
					Did the {formatCurrency(s.amount, currency)} payment go through?
				</p>
				<div className="mt-2 flex gap-2">
					<button
						type="button"
						onClick={() => markPaid(s, "upi_return")}
						className="btn-primary !py-2"
					>
						<Check className="h-4 w-4" />
						Yes, mark paid
					</button>
					<button
						type="button"
						onClick={() => {
							setPending(null);
							setAskConfirm(false);
						}}
						className="btn-ghost"
					>
						Not yet
					</button>
				</div>
			</div>
		) : null;

	/**
	 * A WhatsApp reminder with a link that lands the debtor on what they owe:
	 * in a shared group, their personal link (it opens the group as them, on
	 * settle-up); otherwise the encrypted summary, which they can save as a group.
	 * (UPI links aren't tappable in WhatsApp, so the pay button lives behind the link.)
	 */
	const remind = async (s: Settlement) => {
		// Shared names, not this device's nicknames: the message goes to them.
		const debtor = sharePeople.find((p) => p.id === s.from);
		const creditor = sharePeople.find((p) => p.id === s.to);
		track("settlement_remind_clicked", { synced: !!syncLink });
		try {
			const url = syncLink
				? groupUrl(syncLink, s.from, true)
				: await encodeShareUrl(buildShareSnapshot({ name: groupName, currency, members: sharePeople, expenses }));
			const sent = await sendViaWhatsApp(
				oweMessage(debtor?.name || "", `a reminder for ${groupName}`, formatCurrency(s.amount, currency), url, showUpi ? creditor?.upiId : undefined)
			);
			if (sent === "copied") {
				setRemindCopied(s.from);
				setTimeout(() => setRemindCopied(null), 2500);
			}
		} catch (err) {
			trackError(err, { source: "settlement_remind" });
		}
	};

	return (
		<div className="space-y-4">
			{identityPicker}
			{viewingAs}

			{mine.map((s) => {
				const iPay = s.from === me!.id;
				const other = getPersonName(iPay ? s.to : s.from);
				return (
					<section
						key={`${s.from}-${s.to}`}
						className="surface border-brand-200 p-4 sm:p-5 shadow-raised"
					>
						<p className="text-sm font-medium text-ink-muted">
							{iPay ? `You pay ${other}` : `${other} owes you`}
						</p>
						<p
							className={`mt-1 font-display text-4xl font-semibold tabular-nums ${
								iPay ? "text-ink" : "text-positive"
							}`}
						>
							{formatCurrency(s.amount, currency)}
						</p>

						{iPay ? (
							<div className="mt-4 space-y-2">
								{showUpi && (
									<UpiSettlementActions
										key={`${s.to}-${getPerson(s.to)?.upiId || "none"}`}
										settlement={s}
										from={getPerson(s.from)}
										to={getPerson(s.to)}
										currency={currency}
										groupName={groupName}
										onSaveUpi={onUpdateMemberUpi}
										onPay={() => {
											setPending({ from: s.from, to: s.to, amount: s.amount });
											setAskConfirm(false);
										}}
									/>
								)}
								{canRecord && !(askConfirm && sameSettlement(pending, s)) && (
									<button
										type="button"
										onClick={() => markPaid(s, "hero")}
										className={showUpi && getPerson(s.to)?.upiId ? "btn-ghost w-full" : "btn-primary w-full !py-3"}
									>
										<Check className="h-4 w-4" />
										{showUpi && getPerson(s.to)?.upiId ? "Already paid? Mark as paid" : "Mark as paid"}
									</button>
								)}
								{canRecord && confirmPrompt(s)}
							</div>
						) : canRecord ? (
							<div className="mt-4 grid grid-cols-2 gap-2">
								<button type="button" onClick={() => remind(s)} className="btn-secondary !py-2.5">
									{remindCopied === s.from ? <Check className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
									{remindCopied === s.from ? "Copied" : "Remind"}
								</button>
								<button
									type="button"
									onClick={() => markPaid(s, "hero_received")}
									className="btn-primary !py-2.5"
								>
									<Check className="h-4 w-4" />
									Mark received
								</button>
							</div>
						) : null}
					</section>
				);
			})}

			{iAmEven && (
				<section className="surface flex items-center gap-3 p-4">
					<CircleCheck className="h-6 w-6 shrink-0 text-positive" strokeWidth={1.75} />
					<div>
						<p className="font-semibold text-ink">You&apos;re all square</p>
						<p className="text-sm text-ink-muted">
							You don&apos;t owe anyone, and nobody owes you.
						</p>
					</div>
				</section>
			)}

			{others.length > 0 && (
				<section>
					<h2 className="label-text mb-2 px-1">
						{me ? "Between others" : `${settlements.length} payments settle the group`}
					</h2>
					<ul className="surface divide-y divide-line overflow-hidden">
						{others.map((s) => (
							<li key={`${s.from}-${s.to}`} className="flex items-center gap-3 px-4 py-3">
								<div className="min-w-0 flex-1">
									<SettlementLine s={s} currency={currency} name={getPersonName} compact />
								</div>
								{canRecord && (
									<button
										type="button"
										onClick={() => markPaid(s, "row")}
										className="btn-ghost shrink-0 !px-2.5 text-brand-700"
										aria-label={`Mark ${getPersonName(s.from)}'s payment to ${getPersonName(s.to)} as paid`}
									>
										<Check className="h-4 w-4" />
										Paid
									</button>
								)}
							</li>
						))}
					</ul>
				</section>
			)}

			{canRecord && (
				<p className="px-1 text-xs text-ink-muted">
					Marking a payment paid is a note for the group — SplitBiller never sees
					or verifies money.
				</p>
			)}

			{canShare && (
				<section className="surface p-4 sm:p-5">
					<h2 className="font-semibold text-ink">Send it to the group</h2>
					<p className="mb-4 mt-0.5 text-sm text-ink-muted">
						Everyone sees who pays whom and what&apos;s already paid.
					</p>
					<ShareSettlementActions
						name={groupName}
						people={sharePeople}
						expenses={expenses}
						currency={currency}
						primary
						source="dashboard"
						syncLink={syncLink}
					/>
				</section>
			)}
		</div>
	);
};

const SettlementLine = ({
	s,
	currency,
	name,
	compact = false,
}: {
	s: Settlement;
	currency: Currency;
	name: (id: string) => string;
	compact?: boolean;
}) => (
	<div className="flex items-center justify-between gap-3">
		<div className="flex min-w-0 flex-1 items-center gap-2 text-ink">
			<span className="truncate font-semibold">{name(s.from)}</span>
			<ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
			<span className="sr-only">pays</span>
			<span className="truncate font-semibold">{name(s.to)}</span>
		</div>
		<p
			className={`shrink-0 font-semibold tabular-nums text-ink ${
				compact ? "" : "text-lg"
			}`}
		>
			{formatCurrency(s.amount, currency)}
		</p>
	</div>
);
