"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { AmountInput, Crumb, DetailsFields, ModeToggle, Presets, Stepper, inr, useTween, type SplitDraft } from "./shared";

const GOLD = "#e8c46a";

/** A red-and-gold shagun envelope on a festive pattern. */
export const EnvelopeScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const total = useTween(d.total);
	const each = useTween(d.each);
	const pattern = `radial-gradient(circle at 50% 50%, ${GOLD}33 0 3px, transparent 4px) 0 0 / 28px 28px, radial-gradient(circle at 50% 50%, ${t.theme.from}14 0 10px, transparent 11px) 14px 14px / 28px 28px, #fbf6ee`;
	const canAddOne = d.total > 0 && d.total % 10 === 0;

	return (
		<section className="px-4 py-10 sm:py-14" style={{ background: pattern }}>
			<div className="mx-auto max-w-2xl text-center">
				<Crumb t={t} className="text-left text-ink" />
				<h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
				<p className="mx-auto mt-3 max-w-xl text-ink-soft sm:text-lg">{t.sub}</p>

				{/* Envelope */}
				<div
					className="relative mx-auto mt-10 aspect-[1.3] w-full sm:aspect-[1.6] max-w-[440px] overflow-hidden rounded-xl shadow-2xl"
					style={{ background: `linear-gradient(160deg, ${t.theme.from}, #6b0f24)`, boxShadow: `inset 0 0 0 6px ${t.theme.from}, inset 0 0 0 8px ${GOLD}, 0 24px 48px -12px rgba(107,15,36,.45)` }}
				>
					<span aria-hidden className="absolute inset-x-0 top-0 h-[50%]" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", background: `linear-gradient(180deg, #7f1230, ${t.theme.from})` }} />
					<span aria-hidden className="absolute inset-x-0 top-0 h-[50%]" style={{ clipPath: "polygon(0 0, 2% 0, 50% 96%, 98% 0, 100% 0, 50% 100%)", background: GOLD }} />
					<span
						aria-hidden
						className="absolute left-1/2 top-[50%] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-2xl font-bold"
						style={{ background: `radial-gradient(circle at 35% 35%, #fff3c4, ${GOLD} 60%, #b8862b)`, color: "#7f1230" }}
					>
						₹
					</span>
					<div className="absolute inset-x-0 bottom-4 px-4">
						<p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: GOLD }}>Shagun</p>
						<p className="font-display text-4xl font-semibold tabular-nums sm:text-5xl" style={{ color: GOLD }} aria-live="polite">{inr(total)}</p>
						<p className="mt-0.5 truncate text-xs text-white/80">{d.even ? `${inr(each)} from each of ${d.people}` : d.title || "From all of us"}</p>
					</div>
				</div>

				{canAddOne && (
					<button
						type="button"
						onClick={() => d.setAmount(String(d.total + 1))}
						className="mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
						style={{ borderColor: GOLD, color: "#7f1230", background: "#fff8e6" }}
					>
						Add the shagun ₹1 → {inr(d.total + 1)}
					</button>
				)}

				<div className="surface mt-8 space-y-4 p-5 text-left sm:p-6">
					<AmountInput d={d} label="Shagun goal" />
					<Presets t={t} d={d} />
					<ModeToggle t={t} d={d} />
					{d.even && <Stepper t={t} d={d} />}
					<div className="border-t border-line pt-4">
						<DetailsFields d={d} />
					</div>
				</div>
			</div>
		</section>
	);
};
