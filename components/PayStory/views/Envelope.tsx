"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { MarkPaid, PayButton, ShareBar, Trust, YourAmount, inr, type PayState } from "./shared";

const GOLD = "#e8c46a";
const MAROON = "#7f1230";

/** The shagun envelope shows what's been gathered; the back lists everyone who gave. */
export const EnvelopeView = ({ t, p }: { t: SplitTemplate; p: PayState }) => {
	const { req } = p;
	const pattern = `radial-gradient(circle at 50% 50%, ${GOLD}33 0 3px, transparent 4px) 0 0 / 28px 28px, radial-gradient(circle at 50% 50%, ${t.theme.from}14 0 10px, transparent 11px) 14px 14px / 28px 28px, #fbf6ee`;

	return (
		<section className="min-h-[calc(100dvh-3.5rem)] px-4 py-8 sm:py-12" style={{ background: pattern }}>
			<div className="mx-auto max-w-xl text-center">
				<div className="relative mx-auto aspect-[1.2] w-full max-w-[460px] overflow-hidden rounded-xl sm:aspect-[1.5]" style={{ background: `linear-gradient(160deg, ${t.theme.from}, #6b0f24)`, boxShadow: `inset 0 0 0 6px ${t.theme.from}, inset 0 0 0 8px ${GOLD}, 0 24px 48px -12px rgba(107,15,36,.45)` }}>
					<span aria-hidden className="absolute inset-x-0 top-0 h-[44%]" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", background: `linear-gradient(180deg, ${MAROON}, ${t.theme.from})` }} />
					<span aria-hidden className="absolute inset-x-0 top-0 h-[44%]" style={{ clipPath: "polygon(0 0, 2% 0, 50% 96%, 98% 0, 100% 0, 50% 100%)", background: GOLD }} />
					<span aria-hidden className="absolute left-1/2 top-[44%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-2xl font-bold" style={{ background: `radial-gradient(circle at 35% 35%, #fff3c4, ${GOLD} 60%, #b8862b)`, color: MAROON }}>₹</span>
					<div className="absolute inset-x-0 bottom-4 px-5" style={{ color: GOLD }}>
						<p className="text-[11px] font-semibold uppercase tracking-[0.3em]">Shagun gathered</p>
						<p className="font-display text-4xl font-semibold tabular-nums sm:text-5xl">{inr(p.paid)}</p>
						<p className="truncate text-sm text-white/90">{req.title} · goal {inr(req.target)}</p>
						<div className="mx-auto mt-2 h-1.5 max-w-[70%] overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Amount collected" aria-valuenow={Math.round(p.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
							<div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.progress * 100}%`, background: GOLD }} />
						</div>
					</div>
				</div>

				<div className="mx-auto mt-8 max-w-md rounded-xl border border-[#e8c46a]/60 bg-[#fffaf0] p-6 text-left text-ink shadow-lg">
					<p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: MAROON }}>With blessings from</p>
					<ul className="mt-3 space-y-1.5">
						<li className="flex justify-between border-b border-[#c9a24a]/40 pb-1 font-display text-lg italic"><span>{req.name}</span><span className="text-sm not-italic text-ink-muted">organiser</span></li>
						{req.paid.map(([n, a], i) => (
							<li key={i} className="flex justify-between border-b border-[#c9a24a]/40 pb-1 font-display text-lg italic"><span>{n}</span><span className="tabular-nums not-italic">{inr(a)}</span></li>
						))}
					</ul>
					{p.done ? (
						<p className="mt-5 text-center font-display text-xl font-semibold" style={{ color: MAROON }}>The envelope is full 🙏</p>
					) : (
						<div className="mt-5 space-y-3">
							<p className="flex items-baseline gap-2 font-display text-3xl font-semibold"><span className="text-sm font-normal text-ink-muted">My shagun</span><YourAmount p={p} /></p>
							<PayButton p={p} className="w-full rounded-xl py-3 text-white" style={{ background: `linear-gradient(90deg, ${MAROON}, ${t.theme.to})` }}>Add to the envelope by UPI</PayButton>
							<MarkPaid p={p} btnClass="text-white" btnStyle={{ background: MAROON }} />
						</div>
					)}
					<ShareBar p={p} t={t} className="mt-5" primary="text-white" primaryStyle={{ background: MAROON }} secondary="border border-ink/20" />
					<Trust p={p} className="mt-3" />
				</div>
			</div>
		</section>
	);
};
