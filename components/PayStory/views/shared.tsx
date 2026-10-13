"use client";

import { useState } from "react";
import { UpiQr, useCanOpenUpiApps } from "@/components/Settlements/UpiQr";
import { track } from "@/lib/analytics";
import { buildUpiLink } from "@/utils/upi";
import { encodeRequest, sharePerPerson, totalPaid, type PayRequest, type SplitTemplate } from "@/utils/payStory";

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export type PayOptions = {
	/** Stable link for a cloud split; payments sync for everyone, so no "updated link" to reshare. */
	shareUrl?: string;
};

/** Everything a payer can do on a shared split. Views only decide how it looks. */
export function usePay(t: SplitTemplate, req: PayRequest, onChange: (r: PayRequest) => void, opts: PayOptions = {}) {
	const live = Boolean(opts.shareUrl);
	const canOpenApps = useCanOpenUpiApps();
	const share = sharePerPerson(req);
	const paid = totalPaid(req);
	const remaining = Math.max(req.target - paid, 0);
	const progress = Math.min(paid / req.target, 1);
	const done = paid >= req.target;

	const [amount, setAmount] = useState(share ? String(Math.min(share, remaining || share)) : "");
	const [who, setWho] = useState("");
	const [paying, setPaying] = useState(false);
	const [copied, setCopied] = useState(false);

	const amt = Math.round(Number(amount)) || 0;
	const upi = amt >= 1 ? buildUpiLink({ pa: req.upiId, pn: req.name, am: amt, tn: req.title }) : null;

	const record = () => {
		if (!who.trim() || !(amt >= 1)) return;
		onChange({ ...req, paid: [...req.paid, [who.trim().slice(0, 30), amt]] });
		setWho("");
		setPaying(false);
	};

	const startPay = () => {
		if (!upi) return;
		setPaying(true);
		track("upi_pay_link_clicked", { source: "split", template: t.id });
	};

	const shareLink = async () => {
		const url = opts.shareUrl ?? `${window.location.origin}/pay-story#${encodeRequest(req)}`;
		const text = done
			? `We did it! ${req.title} is fully paid 🎉`
			: live
				? `${req.title}: pay your share here. It updates live for everyone.`
				: `${req.title}: ${inr(paid)} of ${inr(req.target)} so far. Join in:`;
		if (navigator.share) {
			try {
				await navigator.share({ title: req.title, text, url });
				return;
			} catch {
				/* cancelled: fall through to copy */
			}
		}
		try {
			await navigator.clipboard?.writeText(`${text} ${url}`);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* clipboard blocked: nothing else to do */
		}
	};

	return {
		live, req, canOpenApps, share, paid, remaining, progress, done,
		amount, setAmount, amt, upi, who, setWho, paying, startPay, record, copied, shareLink,
		/** How many even shares are covered so far (for seats, jerseys, slices). */
		sharesPaid: share ? Math.min(Math.floor(paid / share), req.people) : 0,
	};
}

export type PayState = ReturnType<typeof usePay>;

/** The payer's amount: fixed share as text, or typed in place when friends choose. */
export const YourAmount = ({ p, className = "" }: { p: PayState; className?: string }) =>
	p.share ? (
		<span className={`tabular-nums ${className}`}>{inr(p.amt)}</span>
	) : (
		<span className={`inline-flex items-baseline ${className}`}>
			<span aria-hidden>₹</span>
			<input
				aria-label="Your amount"
				inputMode="numeric"
				value={p.amount}
				onChange={(e) => p.setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
				placeholder="0"
				className="inline-edit tabular-nums"
				style={{ width: `${Math.max(p.amount.length, 3) + 1}ch` }}
			/>
		</span>
	);

/** Pay through UPI: a button on phones, a QR to scan on desktop. */
export const PayButton = ({ p, className = "", style, children }: { p: PayState; className?: string; style?: React.CSSProperties; children?: React.ReactNode }) => {
	if (p.canOpenApps === false && p.upi) {
		return (
			<div className="flex items-center gap-4 text-left">
				<UpiQr link={p.upi} label={`UPI QR to pay ${inr(p.amt)} to ${p.req.name}`} className="h-32 w-32" />
				<p className="text-sm opacity-80">Scan with any UPI app on your phone to pay {inr(p.amt)}.</p>
			</div>
		);
	}
	return (
		<a
			href={p.upi ?? undefined}
			onClick={p.startPay}
			aria-disabled={!p.upi}
			className={`inline-flex items-center justify-center gap-2 font-semibold transition-transform active:scale-[.98] ${p.upi ? "" : "pointer-events-none opacity-50"} ${className}`}
			style={style}
		>
			{children ?? `Pay ${p.amt ? inr(p.amt) : ""} with UPI`}
		</a>
	);
};

/** After paying, the payer adds their name so everyone can see it. */
export const MarkPaid = ({ p, className = "", btnClass = "", btnStyle }: { p: PayState; className?: string; btnClass?: string; btnStyle?: React.CSSProperties }) =>
	p.paying || p.canOpenApps === false ? (
		<div className={`flex items-end gap-3 ${className}`}>
			<label className="min-w-0 flex-1 text-left">
				<span className="block text-xs opacity-70">Paid? Add your name</span>
				<input
					value={p.who}
					maxLength={30}
					onChange={(e) => p.setWho(e.target.value)}
					placeholder="Your first name"
					className="inline-edit w-full py-1 text-base"
				/>
			</label>
			<button type="button" onClick={p.record} disabled={!p.who.trim() || !(p.amt >= 1)} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${btnClass}`} style={btnStyle}>
				I’ve paid ✓
			</button>
		</div>
	) : null;

/** Share the updated link, or start your own split. */
export const ShareBar = ({ p, t, className = "", primary = "", primaryStyle, secondary = "" }: { p: PayState; t: SplitTemplate; className?: string; primary?: string; primaryStyle?: React.CSSProperties; secondary?: string }) => (
	<div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${className}`}>
		<button type="button" onClick={p.shareLink} className={`rounded-xl px-4 py-3 text-sm font-semibold ${primary}`} style={primaryStyle}>
			{p.copied ? "Link copied" : p.done ? "Share the “we did it” moment" : p.live ? "Share link" : "Share updated link"}
		</button>
		<a href={`/split/${t.id}`} className={`rounded-xl px-4 py-3 text-center text-sm font-semibold ${secondary}`}>Make your own</a>
	</div>
);

/** Who is being paid, and the honest caveat about trust. */
export const Trust = ({ p, className = "" }: { p: PayState; className?: string }) => (
	<p className={`text-xs opacity-70 ${className}`}>
		{p.live && <span className="mb-1 block font-semibold">🔒 End-to-end encrypted · updates live for everyone with the link</span>}
		Paying <b>{p.req.upiId}</b>. Check your UPI app shows <b>{p.req.name}</b> before you confirm. Payments are on trust:
		{p.live ? " “I’ve paid” marks are added by the payer, not confirmed by UPI." : " after someone taps “I’ve paid”, share the updated link so everyone sees it."}
	</p>
);
