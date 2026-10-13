"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { AmountInput, Crumb, DetailsFields, Presets, inr, useTween, type SplitDraft } from "./shared";

const COLORS = ["#e11d48", "#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#0891b2", "#db2777", "#65a30d"];
const MAX_TILES = 8;

/** A streaming-style "who's sharing?" profile picker. */
export const ProfilesScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const shown = Math.min(d.people, MAX_TILES);

	return (
		<section className="px-4 py-10 text-white sm:py-14" style={{ background: `linear-gradient(180deg, ${t.theme.to}66, #141414 22rem), #141414` }}>
			<div className="mx-auto max-w-4xl text-center">
				<Crumb t={t} className="text-left" />
				<h1 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">Who’s sharing the plan?</h1>
				<p className="mx-auto mt-3 max-w-xl text-white/70 sm:text-lg">{t.sub}</p>

				<ul className="mt-10 flex flex-wrap justify-center gap-5" aria-label="Members">
					{Array.from({ length: shown }, (_, i) => (
						<li key={i} className="group w-20 sm:w-24">
							<div className="relative aspect-square rounded-lg transition-transform group-hover:scale-105" style={{ background: COLORS[i % COLORS.length] }}>
								<span aria-hidden className="absolute inset-0 flex items-end justify-center pb-3">
									<span className="h-2 w-8 rounded-b-full border-b-4 border-white/90" />
								</span>
								<span aria-hidden className="absolute left-1/4 top-1/3 h-2 w-2 rounded-full bg-white/90" />
								<span aria-hidden className="absolute right-1/4 top-1/3 h-2 w-2 rounded-full bg-white/90" />
								{i > 0 && (
									<button
										type="button"
										aria-label="Remove member"
										onClick={() => d.setPeople(d.people - 1)}
										className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-[#141414] group-hover:flex group-focus-within:flex"
									>
										×
									</button>
								)}
							</div>
							<p className="mt-2 text-sm text-white/80">{i === 0 ? "You" : `Member ${i + 1}`}</p>
							<p className="text-sm font-semibold tabular-nums">{inr(each)}</p>
						</li>
					))}
					<li className="w-20 sm:w-24">
						<button
							type="button"
							onClick={() => d.setPeople(d.people + 1)}
							className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-white/30 text-4xl text-white/60 transition-colors hover:border-white hover:text-white"
							aria-label="Add member"
						>
							+
						</button>
						<p className="mt-2 text-sm text-white/60">Add</p>
					</li>
				</ul>
				{d.people > MAX_TILES && <p className="mt-3 text-sm text-white/60">+ {d.people - MAX_TILES} more members</p>}
				<div className="mt-4 flex justify-center gap-3 text-sm">
					<button type="button" onClick={() => d.setPeople(d.people - 1)} className="rounded-md border border-white/25 px-3 py-1 text-white/80 hover:bg-white/10">Remove one</button>
				</div>

				<div className="mx-auto mt-10 max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/[.04] p-6 text-left">
					<AmountInput d={d} tone="dark" label="Plan price per cycle" />
					<Presets t={t} d={d} tone="dark" format={(n) => `Plan ${inr(n)}`} />
					<div className="border-t border-white/10 pt-4">
						<DetailsFields d={d} tone="dark" />
					</div>
				</div>
			</div>
		</section>
	);
};
