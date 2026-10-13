"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { AmountInput, Crumb, DetailsFields, ModeToggle, Presets, Stepper, inr, useTween, type SplitDraft } from "./shared";

const LED = "#fde047";
const JERSEY = "polygon(22% 0, 38% 0, 50% 10%, 62% 0, 78% 0, 100% 18%, 86% 36%, 80% 32%, 80% 100%, 20% 100%, 20% 32%, 14% 36%, 0 18%)";
const MAX_JERSEYS = 16;

/** A stadium scoreboard over striped turf, with a jersey per player. */
export const ScoreboardScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const total = useTween(d.total);
	const turf = "repeating-linear-gradient(90deg, #2f7d32 0 64px, #2a7030 64px 128px)";
	const cell = (label: string, value: string) => (
		<div className="min-w-0 px-3 py-3 text-center">
			<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{label}</p>
			<p className="mt-1 truncate font-mono text-2xl font-bold tabular-nums sm:text-4xl" style={{ color: LED, textShadow: `0 0 10px ${LED}99` }}>{value}</p>
		</div>
	);

	return (
		<section className="px-4 py-10 sm:py-14" style={{ background: turf }}>
			<div className="mx-auto max-w-4xl">
				<div className="text-white">
					<Crumb t={t} />
					<h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
					<p className="mt-3 max-w-xl text-white/85 sm:text-lg">{t.sub}</p>
				</div>

				<div className="mt-8 rounded-2xl border-4 border-zinc-700 bg-[#0b0b0d] p-2 shadow-2xl">
					<p className="truncate pt-1 text-center font-mono text-xs uppercase tracking-[0.3em] text-white/60">{d.title || t.label}</p>
					<div className="grid grid-cols-3 divide-x divide-white/10">
						{cell("Total", inr(total))}
						{cell("Players", d.even ? String(d.people) : "—")}
						{cell("Each", d.even ? inr(each) : "Any")}
					</div>
				</div>

				{d.even && (
					<ul className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8" aria-label={`${d.people} players`}>
						{Array.from({ length: Math.min(d.people, MAX_JERSEYS) }, (_, i) => (
							<li key={i} className="flex flex-col items-center">
								<span
									className="flex aspect-square w-full max-w-[64px] items-center justify-center pt-2 font-mono text-lg font-bold text-white"
									style={{ clipPath: JERSEY, background: i % 2 ? t.theme.to : t.theme.from }}
								>
									{i + 1}
								</span>
								<span className="mt-1 text-xs font-semibold tabular-nums text-white">{inr(each)}</span>
							</li>
						))}
					</ul>
				)}
				{d.even && d.people > MAX_JERSEYS && <p className="mt-2 text-sm text-white/80">+ {d.people - MAX_JERSEYS} more on the bench</p>}

				<div className="surface mt-8 grid gap-6 p-5 sm:p-6 md:grid-cols-2">
					<div className="min-w-0 space-y-4">
						<AmountInput d={d} label="Booking cost" />
						<Presets t={t} d={d} />
						<ModeToggle t={t} d={d} />
						{d.even && <Stepper t={t} d={d} />}
					</div>
					<div className="min-w-0">
						<DetailsFields d={d} />
					</div>
				</div>
			</div>
		</section>
	);
};
