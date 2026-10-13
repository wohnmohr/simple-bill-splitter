"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { Counter, Crumb, ModeSwitch, NameField, Note, TitleField, UpiField, inr, useTween, type SplitDraft } from "./shared";

const GLOW = "#facc15";

/** One arc segment of the gauge, from angle a0 to a1 (radians, π = left, 2π = right). */
const arc = (a0: number, a1: number, r = 88, c = 100) => {
	const p = (a: number) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
	return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
};

/** The meter is the interface: type the reading into its digits, turn the dial, press power. */
export const MeterScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const digits = d.amount.padStart(6, "0").split("");
	const n = d.even ? Math.min(d.people, 24) : 1;
	const gap = n > 1 ? Math.min(0.05, Math.PI / n / 4) : 0;
	const lcd = "rounded-lg border border-white/10 bg-black px-3 py-2 font-mono text-sm";

	return (
		<section className="px-4 py-10 text-white sm:py-14" style={{ background: `radial-gradient(60rem 30rem at 80% -10%, ${GLOW}2e, transparent 60%), #0e1014` }}>
			<div className="mx-auto max-w-3xl">
				<Crumb t={t} />
				<h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">
					{t.headline} <span style={{ color: GLOW }}>{t.emoji}</span>
				</h1>
				<p className="mt-3 max-w-xl text-white/75 sm:text-lg">{t.sub}</p>

				<div className="mt-8 rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#1b1e24] to-[#0b0c0f] p-5 shadow-[0_0_90px_-25px_rgba(250,204,21,.4)] sm:p-8">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Bill reading · tap to type</p>
						<ModeSwitch d={d} labels={["Even", "Any"]} className="bg-white/10" on="text-[#111]" onStyle={{ background: GLOW }} off="text-white/70" />
					</div>

					{/* Digits: one transparent input over the odometer */}
					<label className="group relative mt-3 flex cursor-text gap-1.5 rounded-xl p-1 focus-within:ring-2 focus-within:ring-[#facc15]/60">
						<span aria-hidden className="flex w-9 items-center justify-center rounded-md bg-white/5 font-mono text-2xl text-white/60">₹</span>
						{digits.map((g, i) => (
							<span
								key={i}
								aria-hidden
								className="flex h-16 flex-1 items-center justify-center rounded-md border border-white/10 bg-black font-mono text-3xl tabular-nums sm:text-4xl"
								style={{ color: GLOW, textShadow: `0 0 12px ${GLOW}aa`, opacity: i < digits.length - d.amount.length ? 0.3 : 1 }}
							>
								{g}
							</span>
						))}
						<input
							aria-label="Bill amount"
							inputMode="numeric"
							value={d.amount}
							onChange={(e) => d.setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
							className="absolute inset-0 w-full cursor-text bg-transparent text-transparent caret-transparent outline-none"
						/>
					</label>

					<div className="mt-4 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
						<svg viewBox="0 0 200 112" className="mx-auto w-full max-w-xs" role="img" aria-label={d.even ? `${d.people} equal shares of ${inr(d.each)}` : "Any amount"}>
							<path d={arc(Math.PI, 2 * Math.PI)} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={14} />
							{Array.from({ length: n }, (_, i) => {
								const seg = Math.PI / n;
								return <path key={i} d={arc(Math.PI + i * seg + gap, Math.PI + (i + 1) * seg - gap)} fill="none" stroke={i % 2 ? "#f59e0b" : GLOW} strokeWidth={14} style={{ filter: `drop-shadow(0 0 4px ${GLOW}88)` }} />;
							})}
							<text x="100" y="88" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="600">{d.even ? inr(each) : inr(d.total)}</text>
							<text x="100" y="106" textAnchor="middle" fill="rgba(255,255,255,.6)" fontSize="9" letterSpacing="1.5">{d.even ? `PER ${t.who.toUpperCase()}` : "GOAL · ANY AMOUNT"}</text>
						</svg>
						{d.even && (
							<div className="text-center">
								<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">{t.who}s</p>
								<Counter t={t} d={d} className="mt-1 text-2xl font-semibold" btn="h-11 w-11 border border-white/20 bg-white/10 text-xl hover:bg-white/20" />
							</div>
						)}
					</div>

					<div className="mt-6 grid gap-3 sm:grid-cols-3">
						<label className="block"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">Label</span><span className={`mt-1 block ${lcd}`} style={{ color: GLOW }}><TitleField d={d} grow /></span></label>
						<label className="block"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">Account holder</span><span className={`mt-1 block ${lcd}`} style={{ color: GLOW }}><NameField d={d} grow /></span></label>
						<label className="block"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">Pay to UPI</span><span className={`mt-1 block ${lcd}`} style={{ color: GLOW }}><UpiField d={d} grow /></span></label>
					</div>

					<div className="mt-6 flex flex-col items-center gap-3">
						<button
							type="submit"
							aria-label="Switch on: create split link"
							className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#facc15]/70 bg-black text-3xl transition-transform hover:scale-105 active:scale-95"
							style={{ color: GLOW, boxShadow: `0 0 30px ${GLOW}66, inset 0 0 12px ${GLOW}33` }}
						>
							⏻
						</button>
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Switch on to share</p>
						<Note d={d} className="text-center text-white" />
					</div>
				</div>
			</div>
		</section>
	);
};
