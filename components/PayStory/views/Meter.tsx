"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { MarkPaid, PayButton, ShareBar, Trust, YourAmount, inr, type PayState } from "./shared";

const GLOW = "#facc15";
const arc = (a0: number, a1: number, r = 88, c = 100) => {
	const pt = (a: number) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
	return `M ${pt(a0)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${pt(a1)}`;
};

/** The meter reads what's been collected; the gauge charges up as people pay. */
export const MeterView = ({ t, p }: { t: SplitTemplate; p: PayState }) => {
	const { req } = p;
	const digits = String(p.paid).padStart(6, "0").split("");
	const end = Math.PI + Math.PI * p.progress;

	return (
		<section className="min-h-[calc(100dvh-3.5rem)] px-4 py-8 text-white sm:py-12" style={{ background: `radial-gradient(60rem 30rem at 80% -10%, ${GLOW}2e, transparent 60%), #0e1014` }}>
			<div className="mx-auto max-w-xl">
				<p className="text-sm text-white/60">{t.emoji} {t.label} · from {req.name}</p>
				<h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{req.title}</h1>

				<div className="mt-6 rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#1b1e24] to-[#0b0c0f] p-5 shadow-[0_0_90px_-25px_rgba(250,204,21,.4)] sm:p-7">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Collected so far</p>
					<div className="mt-3 flex gap-1.5" aria-label={`${inr(p.paid)} collected`}>
						<span aria-hidden className="flex w-9 items-center justify-center rounded-md bg-white/5 font-mono text-2xl text-white/60">₹</span>
						{digits.map((g, i) => (
							<span key={i} aria-hidden className="flex h-14 flex-1 items-center justify-center rounded-md border border-white/10 bg-black font-mono text-3xl" style={{ color: GLOW, textShadow: `0 0 12px ${GLOW}aa` }}>{g}</span>
						))}
					</div>
					<svg viewBox="0 0 200 112" className="mx-auto mt-5 w-full max-w-xs" role="progressbar" aria-label="Amount collected" aria-valuenow={Math.round(p.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
						<path d={arc(Math.PI, 2 * Math.PI)} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={14} />
						{p.progress > 0 && <path d={arc(Math.PI, end)} fill="none" stroke={GLOW} strokeWidth={14} style={{ filter: `drop-shadow(0 0 5px ${GLOW})` }} />}
						<text x="100" y="86" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="600">{Math.round(p.progress * 100)}%</text>
						<text x="100" y="104" textAnchor="middle" fill="rgba(255,255,255,.6)" fontSize="9" letterSpacing="1.5">OF {inr(req.target)}</text>
					</svg>
					{req.paid.length > 0 && (
						<p className="mt-2 text-center font-mono text-xs text-white/70">{req.paid.map(([n, a]) => `${n} ${inr(a)}`).join(" · ")}</p>
					)}

					{p.done ? (
						<p className="mt-5 text-center text-lg font-semibold" style={{ color: GLOW }}>Fully paid. Lights stay on 💡</p>
					) : (
						<div className="mt-6 flex flex-col items-center gap-3">
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{p.share ? `Your share` : "Your amount"}</p>
							<p className="font-display text-4xl font-semibold" style={{ color: GLOW }}><YourAmount p={p} /></p>
							<PayButton p={p} className="h-20 w-20 rounded-full border-4 border-[#facc15]/70 bg-black text-3xl" style={{ color: GLOW, boxShadow: `0 0 30px ${GLOW}66` }}>⏻</PayButton>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Switch on to pay by UPI</p>
							<MarkPaid p={p} className="w-full" btnClass="text-[#111]" btnStyle={{ background: GLOW }} />
						</div>
					)}
				</div>
				<ShareBar p={p} t={t} className="mt-5" primary="text-[#111]" primaryStyle={{ background: GLOW }} secondary="border border-white/20 text-white" />
				<Trust p={p} className="mt-3 text-center" />
			</div>
		</section>
	);
};
