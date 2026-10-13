"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { Barcode } from "../scenes/shared";
import { MarkPaid, PayButton, ShareBar, Trust, YourAmount, inr, type PayState } from "./shared";

const VENUE: Record<string, string> = { groceries: "FRESH MART", lunch: "OFFICE CANTEEN" };
const ZIGZAG = "conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 18px 100%";

/** The bill, with each payment printed on it, and a PAID stamp once it's settled. */
export const ReceiptView = ({ t, p }: { t: SplitTemplate; p: PayState }) => {
	const { req } = p;
	const cloth = `repeating-linear-gradient(0deg, ${t.theme.from}12 0 22px, transparent 22px 44px), repeating-linear-gradient(90deg, ${t.theme.from}12 0 22px, transparent 22px 44px), #fbf8f3`;
	const row = "flex items-center justify-between gap-4";
	const rule = <div className="my-3 border-t-2 border-dashed border-ink/30" />;

	return (
		<section className="min-h-[calc(100dvh-3.5rem)] px-4 py-8 sm:py-12" style={{ background: cloth }}>
			<div style={{ filter: "drop-shadow(0 18px 24px rgba(28,24,38,.18))" }}>
				<div className="relative mx-auto max-w-[400px] bg-white px-6 pb-12 pt-7 font-mono text-[13px] uppercase text-ink" style={{ rotate: "-0.6deg", WebkitMask: ZIGZAG, mask: ZIGZAG }}>
					{p.done && (
						<span aria-hidden className="pointer-events-none absolute right-6 top-24 rotate-[-18deg] rounded-md border-4 border-positive px-3 py-1 text-3xl font-bold tracking-[0.2em] text-positive opacity-80">PAID</span>
					)}
					<p className="text-center text-lg font-bold tracking-[0.2em]">{VENUE[t.id] ?? "THE TABLE"}</p>
					<p className="mt-1 text-center text-[11px] text-ink-muted">{t.emoji} Bill from {req.name}</p>
					<p className="mt-2 text-center normal-case">{req.title}</p>
					{rule}
					<p className={row}><span>Total</span><span className="tabular-nums">{inr(req.target)}</span></p>
					{p.share > 0 && <p className={row}><span>Split</span><span>÷ {req.people}</span></p>}
					{rule}
					{req.paid.length > 0 ? (
						req.paid.map(([n, a], i) => (
							<p key={i} className={row}><span className="truncate normal-case">✓ {n}</span><span className="tabular-nums">−{inr(a)}</span></p>
						))
					) : (
						<p className="text-center text-[11px] text-ink-muted">No payments yet. Be the first.</p>
					)}
					{rule}
					<p className={`${row} text-base font-bold`}><span>Balance due</span><span className="tabular-nums">{inr(p.remaining)}</span></p>

					{!p.done && (
						<div className="mt-5 space-y-3 normal-case">
							<p className="text-center text-[11px] uppercase text-ink-muted">{p.share ? `Your share` : "Your amount"}</p>
							<p className="text-center font-display text-5xl font-semibold"><YourAmount p={p} /></p>
							<PayButton p={p} className="w-full bg-ink py-3 font-mono text-sm tracking-[0.12em] text-white">PAY {p.amt ? inr(p.amt) : ""} BY UPI ▸</PayButton>
							<MarkPaid p={p} className="font-sans" btnClass="bg-ink text-white" />
						</div>
					)}
					<Barcode seed={t.id + req.target} className="mx-auto mt-5 w-fit text-ink" />
				</div>
			</div>
			<div className="mx-auto mt-6 max-w-[400px] space-y-3">
				<ShareBar p={p} t={t} primary="bg-ink text-white" secondary="border border-ink/20 bg-white text-ink" />
				<Trust p={p} className="text-center text-ink" />
			</div>
		</section>
	);
};
