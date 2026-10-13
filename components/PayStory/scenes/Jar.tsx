"use client";

import { useEffect, useState } from "react";
import type { SplitTemplate } from "@/utils/payStory";
import { Counter, Crumb, InlineAmount, ModeSwitch, NameField, Note, TitleField, UpiField, inr, useTween, type SplitDraft } from "./shared";

const BODY = "M62 34 L62 52 Q30 62 30 104 L30 232 Q30 252 50 252 L150 252 Q170 252 170 232 L170 104 Q170 62 138 52 L138 34 Z";
const TOP = 70;
const BOTTOM = 252;
const MAX_SLICES = 10;
const TAG = "polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)";

const Balloons = ({ t }: { t: SplitTemplate }) => (
	<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
		{([["6%", "10%", t.theme.from, 70], ["88%", "6%", t.theme.to, 90], ["80%", "64%", "#facc15", 56], ["3%", "72%", "#38bdf8", 64]] as const).map(([left, top, color, size], i) => (
			<span key={i} className="absolute rounded-[50%_50%_48%_52%] opacity-30 motion-safe:animate-[jarfloat_6s_ease-in-out_infinite]" style={{ left, top, width: size, height: size * 1.2, background: color, animationDelay: `${i * 0.8}s` }} />
		))}
	</div>
);

const Ribbon = ({ t }: { t: SplitTemplate }) => (
	<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
		<span className="absolute -right-24 top-10 h-10 w-[28rem] rotate-45 opacity-25" style={{ background: t.theme.from }} />
		<span className="absolute -left-24 bottom-16 h-10 w-[28rem] -rotate-45 opacity-20" style={{ background: t.theme.to }} />
	</div>
);

/** Write the goal on the jar, fill in the gift tag, seal it. Gift, party. */
export const JarScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const [filled, setFilled] = useState(false);
	useEffect(() => {
		const id = requestAnimationFrame(() => setFilled(true));
		return () => cancelAnimationFrame(id);
	}, []);

	const slices = d.even ? Math.min(d.people, MAX_SLICES) : 4;
	const h = (BOTTOM - TOP) / slices;
	const id = `jar-${t.id}`;

	return (
		<section className="relative px-4 py-10 sm:py-14" style={{ background: `linear-gradient(180deg, ${t.theme.from}14, #f7f6f3)` }}>
			{t.id === "party" ? <Balloons t={t} /> : <Ribbon t={t} />}
			<style>{`@keyframes jarfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}`}</style>
			<div className="relative mx-auto max-w-4xl">
				<div className="text-ink">
					<Crumb t={t} />
					<h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">
						<span aria-hidden className="mr-2">{t.emoji}</span>{t.headline}
					</h1>
					<p className="mt-3 max-w-xl text-ink-soft sm:text-lg">{t.sub}</p>
				</div>

				<div className="mt-8 grid items-center gap-8 md:grid-cols-2">
					{/* The jar: the goal is written on it */}
					<div className="mx-auto w-full max-w-[320px]">
						<div className="mb-3 flex justify-center">
							<ModeSwitch d={d} labels={["Equal slices", "Any amount"]} className="bg-white shadow-sm" on="text-white" onStyle={{ background: t.theme.to }} off="text-ink-muted" />
						</div>
						<div className="relative">
							<svg viewBox="0 0 200 270" className="w-full" aria-hidden>
								<defs>
									<clipPath id={`${id}-clip`}><path d={BODY} /></clipPath>
									<linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
										<stop offset="0" stopColor={t.theme.from} />
										<stop offset="1" stopColor={t.theme.to} />
									</linearGradient>
								</defs>
								<rect x="52" y="14" width="96" height="22" rx="6" fill={t.theme.to} />
								<g clipPath={`url(#${id}-clip)`}>
									<rect x="0" y={TOP} width="200" height={BOTTOM - TOP} fill={`url(#${id}-fill)`} opacity=".9" style={{ transform: `scaleY(${filled ? 1 : 0})`, transformOrigin: "bottom", transformBox: "fill-box", transition: "transform 1.2s cubic-bezier(.2,.8,.2,1)" }} />
									{Array.from({ length: slices - 1 }, (_, i) => (
										<line key={i} x1="30" x2="170" y1={BOTTOM - h * (i + 1)} y2={BOTTOM - h * (i + 1)} stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="4 4" />
									))}
								</g>
								<path d={BODY} fill="none" stroke="#1c1826" strokeOpacity=".25" strokeWidth="3" />
								<path d="M44 110 Q42 170 48 220" stroke="#fff" strokeOpacity=".5" strokeWidth="6" strokeLinecap="round" fill="none" />
							</svg>
							<div className="absolute inset-x-[18%] top-[48%] flex -translate-y-1/2 flex-col items-center text-white">
								<InlineAmount d={d} label="Goal" className="justify-center font-display text-3xl font-semibold" />
								<span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-90">
									{d.even ? `${d.people} × ${inr(each)}` : "Goal"}
								</span>
							</div>
						</div>
						{d.even && (
							<div className="mt-3 flex items-center justify-center gap-3 text-sm text-ink">
								<span className="text-ink-muted">{t.who}s</span>
								<Counter t={t} d={d} className="text-lg font-semibold" btn="border border-line-strong bg-white hover:bg-paper" />
							</div>
						)}
					</div>

					{/* Gift tag */}
					<div className="relative mx-auto w-full max-w-sm rotate-[-3deg]" style={{ filter: "drop-shadow(0 14px 22px rgba(28,24,38,.18))" }}>
						<div className="bg-[#fffaf0] py-6 pl-14 pr-6 text-ink" style={{ clipPath: TAG }}>
							<span aria-hidden className="absolute left-[7%] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-ink/20 bg-[#f7f6f3]" />
							<p className="font-display text-xl font-semibold italic">{t.id === "party" ? "Party fund" : "A gift from all of us"}</p>
							<p className="mt-3 flex items-center gap-2"><span className="shrink-0 text-sm text-ink-muted">For</span><TitleField d={d} grow className="font-display text-lg italic" /></p>
							<p className="mt-2 flex items-center gap-2"><span className="shrink-0 text-sm text-ink-muted">Organised by</span><NameField d={d} grow className="font-display text-lg italic" /></p>
							<p className="mt-2 flex items-center gap-2"><span className="shrink-0 text-sm text-ink-muted">UPI</span><UpiField d={d} grow /></p>
							<button type="submit" className="mt-4 w-full rounded-full py-2.5 font-semibold text-white transition-transform active:scale-95" style={{ background: `linear-gradient(90deg, ${t.theme.from}, ${t.theme.to})` }}>
								Seal the jar & share 🎀
							</button>
							<Note d={d} className="mt-2 text-ink" />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
