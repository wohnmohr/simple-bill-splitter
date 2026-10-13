"use client";

import { useEffect, useState } from "react";
import type { SplitTemplate } from "@/utils/payStory";
import { AmountInput, Crumb, DetailsFields, ModeToggle, Presets, Stepper, inr, useTween, type SplitDraft } from "./shared";

const BODY = "M62 34 L62 52 Q30 62 30 104 L30 232 Q30 252 50 252 L150 252 Q170 252 170 232 L170 104 Q170 62 138 52 L138 34 Z";
const TOP = 70;
const BOTTOM = 252;
const MAX_SLICES = 10;

const Balloons = ({ t }: { t: SplitTemplate }) => (
	<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
		{[
			["8%", "12%", t.theme.from, 70],
			["86%", "8%", t.theme.to, 90],
			["78%", "62%", "#facc15", 56],
			["4%", "70%", "#38bdf8", 64],
		].map(([left, top, color, size], i) => (
			<span
				key={i}
				className="absolute rounded-[50%_50%_48%_52%] opacity-30 motion-safe:animate-[float_6s_ease-in-out_infinite]"
				style={{ left: left as string, top: top as string, width: size as number, height: (size as number) * 1.2, background: color as string, animationDelay: `${i * 0.8}s` }}
			/>
		))}
	</div>
);

const Ribbon = ({ t }: { t: SplitTemplate }) => (
	<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
		<span className="absolute -right-24 top-10 h-10 w-[28rem] rotate-45 opacity-25" style={{ background: t.theme.from }} />
		<span className="absolute -left-24 bottom-16 h-10 w-[28rem] -rotate-45 opacity-20" style={{ background: t.theme.to }} />
	</div>
);

/** A collection jar that fills toward the goal, split into one slice per person. */
export const JarScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const total = useTween(d.total);
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
			<style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}`}</style>
			<div className="relative mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
				<figure className="mx-auto w-full max-w-[300px]">
					<svg viewBox="0 0 200 270" className="w-full" role="img" aria-label={`Goal ${inr(d.total)}`}>
						<defs>
							<clipPath id={`${id}-clip`}><path d={BODY} /></clipPath>
							<linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
								<stop offset="0" stopColor={t.theme.from} />
								<stop offset="1" stopColor={t.theme.to} />
							</linearGradient>
						</defs>
						<rect x="52" y="14" width="96" height="22" rx="6" fill={t.theme.to} />
						<g clipPath={`url(#${id}-clip)`}>
							<rect
								x="0" y={TOP} width="200" height={BOTTOM - TOP}
								fill={`url(#${id}-fill)`} opacity=".9"
								style={{ transform: `scaleY(${filled ? 1 : 0})`, transformOrigin: "bottom", transformBox: "fill-box", transition: "transform 1.2s cubic-bezier(.2,.8,.2,1)" }}
							/>
							{Array.from({ length: slices - 1 }, (_, i) => (
								<line key={i} x1="30" x2="170" y1={BOTTOM - h * (i + 1)} y2={BOTTOM - h * (i + 1)} stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="4 4" />
							))}
						</g>
						<path d={BODY} fill="none" stroke="#1c1826" strokeOpacity=".25" strokeWidth="3" />
						<path d="M44 110 Q42 170 48 220" stroke="#fff" strokeOpacity=".5" strokeWidth="6" strokeLinecap="round" fill="none" />
						<text x="100" y="168" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="700">{inr(total)}</text>
						<text x="100" y="188" textAnchor="middle" fill="#fff" fillOpacity=".85" fontSize="10" letterSpacing="1.5">
							{d.even ? `${d.people} × ${inr(each)}` : "GOAL"}
						</text>
					</svg>
					<figcaption className="mt-2 text-center text-sm text-ink-muted">
						{d.even ? `One slice per ${t.who}` : `Each ${t.who} adds what they like`}
					</figcaption>
				</figure>

				<div className="min-w-0 space-y-6">
					<div>
						<Crumb t={t} className="text-ink" />
						<h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink [text-wrap:balance] sm:text-5xl">
							<span aria-hidden className="mr-2">{t.emoji}</span>{t.headline}
						</h1>
						<p className="mt-3 max-w-xl text-ink-soft sm:text-lg">{t.sub}</p>
					</div>
					<div className="surface space-y-4 p-5">
						<AmountInput d={d} label="Goal" />
						<Presets t={t} d={d} />
						<ModeToggle t={t} d={d} />
						{d.even && <Stepper t={t} d={d} />}
						<div className="border-t border-line pt-4">
							<DetailsFields d={d} />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
