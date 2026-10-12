"use client";

import { useCallback, useEffect, useState } from "react";
import { UpiQr, useCanOpenUpiApps } from "@/components/Settlements/UpiQr";
import { buildUpiLink, isValidUpiId } from "@/utils/upi";
import {
	getTemplate,
	decodeRequest,
	encodeRequest,
	sharePerPerson,
	totalPaid,
	type PayRequest,
} from "@/utils/payStory";
import { TemplateGrid, themeGradient } from "./TemplateGrid";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fragment = () => (typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, ""));

/** A shared split lives in the #fragment. Without one, send people to pick a split. */
export const PayStoryApp = () => {
	const [req, setReq] = useState<PayRequest | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const sync = () => {
			setReq(fragment() ? decodeRequest(fragment()) : null);
			setReady(true);
		};
		sync();
		window.addEventListener("hashchange", sync);
		return () => window.removeEventListener("hashchange", sync);
	}, []);

	const open = useCallback((next: PayRequest) => {
		window.location.hash = encodeRequest(next);
	}, []);

	if (!ready) return null;
	return req ? <StoryView req={req} onChange={open} /> : <Picker />;
};

const Picker = () => (
	<div className="space-y-5">
		<div>
			<h1 className="font-display text-3xl font-semibold text-ink">What are you splitting?</h1>
			<p className="mt-1 text-ink-muted">Pick one to get a shareable link where friends pay you by UPI.</p>
		</div>
		<TemplateGrid />
	</div>
);

// ── Story ─────────────────────────────────────────────────────

const StoryView = ({ req, onChange }: { req: PayRequest; onChange: (r: PayRequest) => void }) => {
	const canOpenApps = useCanOpenUpiApps();
	const template = getTemplate(req.kind);
	const fg = template.theme.darkText ? "#1c1826" : "#ffffff";
	const share = sharePerPerson(req);
	const paid = totalPaid(req);
	const progress = Math.min(paid / req.target, 1);
	const done = paid >= req.target;

	const [amount, setAmount] = useState(share ? String(share) : "");
	const [who, setWho] = useState("");
	const [paying, setPaying] = useState(false);
	const [copied, setCopied] = useState(false);

	const amt = Math.round(Number(amount));
	const upi = amt >= 1 ? buildUpiLink({ pa: req.upiId, pn: req.name, am: amt, tn: req.title }) : null;

	const record = () => {
		if (!who.trim() || !(amt >= 1)) return;
		onChange({ ...req, paid: [...req.paid, [who.trim().slice(0, 30), amt]] });
		setWho("");
		setPaying(false);
	};

	const link = () => `${window.location.origin}/pay-story#${encodeRequest(req)}`;
	const shareText = done
		? `We did it! ${req.title} is fully paid 🎉`
		: `${req.title} — ${inr(paid)} of ${inr(req.target)} so far. Join in:`;

	const doShare = async () => {
		const url = link();
		if (navigator.share) {
			try {
				await navigator.share({ title: req.title, text: shareText, url });
				return;
			} catch {
				/* cancelled: fall through to copy */
			}
		}
		await navigator.clipboard?.writeText(`${shareText} ${url}`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="space-y-5">
			<section
					className="overflow-hidden rounded-2xl p-6 text-center shadow-card"
					style={{ background: themeGradient(template), color: fg }}
				>
					<p aria-hidden className="text-5xl">{template.emoji}</p>
					<p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] opacity-80">{template.label} · by {req.name}</p>
					<h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{req.title}</h1>
					<div
						role="progressbar"
						aria-label="Amount collected"
						aria-valuenow={Math.round(progress * 100)}
						aria-valuemin={0}
						aria-valuemax={100}
						className="my-5 h-3 overflow-hidden rounded-full"
						style={{ background: "rgba(255,255,255,.3)" }}
					>
						<div
							className="h-full rounded-full transition-all duration-1000 ease-out"
							style={{ width: `${progress * 100}%`, background: fg }}
						/>
					</div>
					<p className="tabular-nums text-4xl font-semibold">
						{inr(paid)} <span className="text-lg font-medium opacity-80">of {inr(req.target)}</span>
					</p>
					<p className="mt-1 text-sm opacity-90" aria-live="polite">
						{done ? "Everyone’s paid 🎉" : `${inr(req.target - paid)} to go`}
					</p>
					{req.paid.length > 0 && (
						<p className="mt-3 text-sm opacity-90">
							{req.paid.map(([n, a]) => `${n} ${inr(a)}`).join(" · ")}
						</p>
					)}
				</section>

			{!done && (
				<section className="surface space-y-3 p-5">
					<label className="block">
						<span className="label-text">Your amount (₹)</span>
						<input
							inputMode="numeric"
							value={amount}
							onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
							readOnly={share > 0}
							className="mt-1 w-full rounded-xl border border-line-strong px-3 py-2.5 text-lg outline-none focus:border-brand-500 read-only:bg-paper"
						/>
					</label>

					{canOpenApps === false && upi && (
						<div className="flex items-center gap-4">
							<UpiQr link={upi} label={`UPI QR to pay ${inr(amt)} to ${req.name}`} />
							<p className="text-sm text-ink-soft">Scan with any UPI app to pay {inr(amt)}.</p>
						</div>
					)}
					{canOpenApps !== false && (
						<a
							href={upi ?? undefined}
							onClick={() => upi && setPaying(true)}
							aria-disabled={!upi}
							className={`btn-primary w-full !py-3 ${upi ? "" : "pointer-events-none opacity-50"}`}
						>
							Pay {amt >= 1 ? inr(amt) : ""} with UPI
						</a>
					)}
					<p className="text-xs text-ink-muted">
						Paying <b className="text-ink-soft">{req.upiId}</b>. Check your UPI app shows <b className="text-ink-soft">{req.name}</b> before you confirm. Only pay people you know.
					</p>

					{(paying || canOpenApps === false) && (
						<div className="flex gap-2 border-t border-line pt-3">
							<input
								value={who}
								maxLength={30}
								onChange={(e) => setWho(e.target.value)}
								placeholder="Your first name"
								className="min-w-0 flex-1 rounded-xl border border-line-strong px-3 py-2.5 outline-none focus:border-brand-500"
							/>
							<button onClick={record} disabled={!who.trim() || !(amt >= 1)} className="btn-secondary">
								I’ve paid
							</button>
						</div>
					)}
				</section>
			)}

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				<button onClick={doShare} className="btn-primary !py-3">
					{copied ? "Link copied" : done ? "Share the “we did it” moment" : "Share updated link"}
				</button>
				<a href={`/split/${template.id}`} className="btn-secondary !py-3">Make your own</a>
			</div>
			<p className="text-center text-xs text-ink-muted">
				Payments are on trust: UPI doesn’t confirm them to us. After someone taps “I’ve paid”, share the updated link so everyone sees who’s paid.
			</p>
		</div>
	);
};
