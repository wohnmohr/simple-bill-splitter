"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { AmountInput, Crumb, DetailsFields, ModeToggle, Presets, Stepper, inr, useTween, type SplitDraft } from "./shared";

const GLOW = "#facc15";

/** One arc segment of the gauge, from angle a0 to a1 (radians, π = left, 2π = right). */
const arc = (a0: number, a1: number, r = 88, c = 100) => {
	const p = (a: number) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
	return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
};

/** A glowing electricity meter on a night panel. */
export const MeterScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const total = useTween(d.total);
	const digits = String(total).padStart(6, "0").slice(-7).split("");
	const n = d.even ? d.people : 1;
	const gap = n > 1 ? Math.min(0.05, Math.PI / n / 4) : 0;

	return (
		<section
			className="px-4 py-10 text-white sm:py-14"
			style={{ background: `radial-gradient(60rem 30rem at 80% -10%, ${GLOW}2e, transparent 60%), #0e1014` }}
		>
			<div className="mx-auto max-w-5xl">
				<Crumb t={t} />
				<h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">
					{t.headline} <span style={{ color: GLOW }}>{t.emoji}</span>
				</h1>
				<p className="mt-3 max-w-xl text-white/75 sm:text-lg">{t.sub}</p>

				<div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
					{/* Meter */}
					<div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_0_80px_-20px_rgba(250,204,21,.35)]">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Bill reading</p>
						<div className="mt-3 flex gap-1.5" aria-label={`Bill ${inr(d.total)}`}>
							<span className="flex w-9 items-center justify-center rounded-md bg-white/5 font-mono text-2xl text-white/60">₹</span>
							{digits.map((g, i) => (
								<span
									key={i}
									className="flex h-14 w-9 items-center justify-center rounded-md border border-white/10 bg-black font-mono text-3xl tabular-nums sm:w-11"
									style={{ color: GLOW, textShadow: `0 0 12px ${GLOW}aa` }}
								>
									{g}
								</span>
							))}
						</div>

						<svg viewBox="0 0 200 112" className="mx-auto mt-6 w-full max-w-sm" role="img" aria-label={d.even ? `${n} equal shares` : "Any amount"}>
							<path d={arc(Math.PI, 2 * Math.PI)} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={14} />
							{Array.from({ length: Math.min(n, 24) }, (_, i) => {
								const seg = Math.PI / Math.min(n, 24);
								return (
									<path
										key={i}
										d={arc(Math.PI + i * seg + gap, Math.PI + (i + 1) * seg - gap)}
										fill="none"
										stroke={i % 2 ? "#f59e0b" : GLOW}
										strokeWidth={14}
										style={{ filter: `drop-shadow(0 0 4px ${GLOW}88)` }}
									/>
								);
							})}
							<text x="100" y="88" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="600" className="font-display">
								{d.even ? inr(each) : inr(total)}
							</text>
							<text x="100" y="106" textAnchor="middle" fill="rgba(255,255,255,.6)" fontSize="9" letterSpacing="1.5">
								{d.even ? `PER ${t.who.toUpperCase()}` : "GOAL · ANY AMOUNT"}
							</text>
						</svg>
					</div>

					{/* Controls */}
					<div className="space-y-4 rounded-3xl border border-white/10 bg-white/[.03] p-6">
						<AmountInput d={d} tone="dark" label="Bill amount" />
						<Presets t={t} d={d} tone="dark" />
						<ModeToggle t={t} d={d} tone="dark" />
						{d.even && <Stepper t={t} d={d} tone="dark" />}
						<div className="border-t border-white/10 pt-4">
							<DetailsFields d={d} tone="dark" />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
