"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { Crumb, InlineAmount, ModeSwitch, NameField, Note, TitleField, UpiField, inr, useTween, type SplitDraft } from "./shared";

const LED = "#fde047";
const JERSEY = "polygon(22% 0, 38% 0, 50% 10%, 62% 0, 78% 0, 100% 18%, 86% 36%, 80% 32%, 80% 100%, 20% 100%, 20% 32%, 14% 36%, 0 18%)";
const MAX_JERSEYS = 16;

/** Run the scoreboard: set the booking, tap jerseys on and off the pitch, blow the whistle. */
export const ScoreboardScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const turf = "repeating-linear-gradient(90deg, #2f7d32 0 64px, #2a7030 64px 128px)";
	const label = "text-[10px] font-bold uppercase tracking-[0.2em] text-white/50";
	const led = { color: LED, textShadow: `0 0 10px ${LED}99` };

	return (
		<section className="px-4 py-10 sm:py-14" style={{ background: turf }}>
			<div className="mx-auto max-w-4xl">
				<div className="text-white">
					<Crumb t={t} />
					<h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
					<p className="mt-3 max-w-xl text-white/85 sm:text-lg">{t.sub}</p>
				</div>

				<div className="mt-8 rounded-2xl border-4 border-zinc-700 bg-[#0b0b0d] p-3 shadow-2xl">
					<div className="flex justify-center font-mono text-sm uppercase tracking-[0.25em] text-white/80">
						<TitleField d={d} grow className="max-w-xs text-center" />
					</div>
					<div className="mt-2 grid grid-cols-3 divide-x divide-white/10">
						<div className="min-w-0 px-2 py-2 text-center">
							<p className={label}>Total</p>
							<span className="mt-1 flex justify-center" style={led}><InlineAmount d={d} label="Booking cost" className="font-mono text-2xl font-bold sm:text-4xl" /></span>
						</div>
						<div className="min-w-0 px-2 py-2 text-center">
							<p className={label}>Players</p>
							<p className="mt-1 font-mono text-2xl font-bold tabular-nums sm:text-4xl" style={led}>{d.even ? d.people : "—"}</p>
						</div>
						<div className="min-w-0 px-2 py-2 text-center">
							<p className={label}>Each</p>
							<p className="mt-1 truncate font-mono text-2xl font-bold tabular-nums sm:text-4xl" style={led}>{d.even ? inr(each) : "Any"}</p>
						</div>
					</div>
					<div className="mt-2 flex justify-center">
						<ModeSwitch d={d} labels={["Equal split", "Any amount"]} className="bg-white/10" on="text-[#111]" onStyle={{ background: LED }} off="text-white/70" />
					</div>
				</div>

				{d.even && (
					<>
						<p className="mt-6 text-center text-sm font-semibold text-white/90">Tap a jersey to drop a player · + to add one</p>
						<ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-8" aria-label={`${d.people} players`}>
							{Array.from({ length: Math.min(d.people, MAX_JERSEYS) }, (_, i) => (
								<li key={i} className="flex flex-col items-center">
									<button
										type="button"
										aria-label={`Remove player ${i + 1}`}
										onClick={() => d.setPeople(d.people - 1)}
										className="flex aspect-square w-full max-w-[64px] items-center justify-center pt-2 font-mono text-lg font-bold text-white transition-transform hover:-translate-y-0.5 active:scale-90"
										style={{ clipPath: JERSEY, background: i % 2 ? t.theme.to : t.theme.from }}
									>
										{i + 1}
									</button>
									<span className="mt-1 text-xs font-semibold tabular-nums text-white">{inr(each)}</span>
								</li>
							))}
							<li className="flex flex-col items-center">
								<button
									type="button"
									aria-label="Add player"
									onClick={() => d.setPeople(d.people + 1)}
									className="flex aspect-square w-full max-w-[64px] items-center justify-center pt-2 text-2xl font-bold text-white/80 hover:text-white"
									style={{ clipPath: JERSEY, background: "rgba(255,255,255,.18)" }}
								>
									+
								</button>
								<span className="mt-1 text-xs text-white/80">Add</span>
							</li>
						</ul>
						{d.people > MAX_JERSEYS && <p className="mt-2 text-center text-sm text-white/80">+ {d.people - MAX_JERSEYS} more on the bench</p>}
					</>
				)}

				{/* Captain's team sheet */}
				<div className="mx-auto mt-8 max-w-md rotate-[0.6deg] rounded-xl bg-[#fffdf5] p-5 shadow-xl">
					<p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">Team sheet</p>
					<p className="mt-3 flex items-center gap-2 text-ink"><span className="shrink-0 text-sm text-ink-muted">Captain</span><NameField d={d} grow className="font-display text-lg font-semibold" /></p>
					<p className="mt-2 flex items-center gap-2 text-ink"><span className="shrink-0 text-sm text-ink-muted">Pay to</span><UpiField d={d} grow /></p>
					<button type="submit" className="mt-4 w-full rounded-xl bg-[#14532d] py-3 font-semibold text-white transition-transform active:scale-95">
						📣 Blow the whistle: share with the team
					</button>
					<Note d={d} className="mt-2 text-center text-ink" />
				</div>
			</div>
		</section>
	);
};
