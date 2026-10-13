"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { Counter, Crumb, InlineAmount, ModeSwitch, NameField, Note, TitleField, UpiField, inr, useTween, type SplitDraft } from "./shared";

const GOLD = "#e8c46a";
const MAROON = "#7f1230";

/** Write on the envelope, address it, press the seal. Shagun. */
export const EnvelopeScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const pattern = `radial-gradient(circle at 50% 50%, ${GOLD}33 0 3px, transparent 4px) 0 0 / 28px 28px, radial-gradient(circle at 50% 50%, ${t.theme.from}14 0 10px, transparent 11px) 14px 14px / 28px 28px, #fbf6ee`;
	const canAddOne = d.total > 0 && d.total % 10 === 0;
	const lined = "flex items-end gap-2 border-b border-[#c9a24a]/50 pb-1";

	return (
		<section className="px-4 py-10 sm:py-14" style={{ background: pattern }}>
			<div className="mx-auto max-w-2xl text-center">
				<Crumb t={t} className="text-left text-ink" />
				<h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
				<p className="mx-auto mt-3 max-w-xl text-ink-soft sm:text-lg">{t.sub}</p>

				{/* Envelope front: amount and occasion are written on it; the seal sends it */}
				<div
					className="relative mx-auto mt-10 aspect-[1.2] w-full max-w-[460px] overflow-hidden rounded-xl sm:aspect-[1.5]"
					style={{ background: `linear-gradient(160deg, ${t.theme.from}, #6b0f24)`, boxShadow: `inset 0 0 0 6px ${t.theme.from}, inset 0 0 0 8px ${GOLD}, 0 24px 48px -12px rgba(107,15,36,.45)` }}
				>
					<span aria-hidden className="absolute inset-x-0 top-0 h-[44%]" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", background: `linear-gradient(180deg, ${MAROON}, ${t.theme.from})` }} />
					<span aria-hidden className="absolute inset-x-0 top-0 h-[44%]" style={{ clipPath: "polygon(0 0, 2% 0, 50% 96%, 98% 0, 100% 0, 50% 100%)", background: GOLD }} />
					<button
						type="submit"
						aria-label="Press the seal to create the shagun link"
						className="absolute left-1/2 top-[44%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-2xl font-bold transition-transform hover:scale-110 active:scale-95"
						style={{ background: `radial-gradient(circle at 35% 35%, #fff3c4, ${GOLD} 60%, #b8862b)`, color: MAROON, boxShadow: "0 6px 14px rgba(0,0,0,.35)" }}
					>
						₹
					</button>
					<div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 px-5" style={{ color: GOLD }}>
						<p className="text-[11px] font-semibold uppercase tracking-[0.3em]">Shagun</p>
						<InlineAmount d={d} label="Shagun amount" className="justify-center font-display text-4xl font-semibold sm:text-5xl" />
						<TitleField d={d} placeholder="For the wedding of…" className="text-center text-sm text-white/90" />
						{d.even && (
							<p className="flex items-center gap-2 text-xs text-white/85">
								from <Counter t={t} d={d} className="text-sm font-semibold" btn="h-6 w-6 border border-white/40 text-white" /> {t.who}s · {inr(each)} each
							</p>
						)}
					</div>
				</div>

				<div className="mt-5 flex flex-wrap items-center justify-center gap-3">
					<ModeSwitch d={d} labels={["Equal shares", "Any amount"]} className="bg-white shadow-sm" on="text-white" onStyle={{ background: MAROON }} off="text-ink-muted" />
					{canAddOne && (
						<button type="button" onClick={() => d.setAmount(String(d.total + 1))} className="rounded-full border px-4 py-1.5 text-sm font-semibold" style={{ borderColor: GOLD, color: MAROON, background: "#fff8e6" }}>
							+ ₹1 for blessings → {inr(d.total + 1)}
						</button>
					)}
				</div>

				{/* Envelope back: who it's from */}
				<div className="mx-auto mt-8 max-w-md rounded-xl border border-[#e8c46a]/60 bg-[#fffaf0] p-6 text-left text-ink shadow-lg">
					<p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: MAROON }}>From the group, collected by</p>
					<p className={`mt-4 ${lined}`}><span className="shrink-0 text-sm text-ink-muted">Name</span><NameField d={d} grow className="font-display text-xl italic" /></p>
					<p className={`mt-4 ${lined}`}><span className="shrink-0 text-sm text-ink-muted">UPI</span><UpiField d={d} grow /></p>
					<button type="submit" className="mt-6 w-full rounded-xl py-3 font-semibold text-white transition-transform active:scale-95" style={{ background: `linear-gradient(90deg, ${MAROON}, ${t.theme.to})` }}>
						Seal & share the envelope
					</button>
					<Note d={d} className="mt-2 text-center text-ink" />
				</div>
			</div>
		</section>
	);
};
