"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { Crumb, InlineAmount, NameField, Note, TitleField, UpiField, inr, useTween, type SplitDraft } from "./shared";

const COLORS = ["#e11d48", "#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#0891b2", "#db2777", "#65a30d"];
const PLANS = ["Basic", "Standard", "Premium"];
const MAX_TILES = 8;

const Face = ({ color }: { color: string }) => (
	<span aria-hidden className="relative block aspect-square rounded-lg" style={{ background: color }}>
		<span className="absolute left-1/4 top-1/3 h-2 w-2 rounded-full bg-white/90" />
		<span className="absolute right-1/4 top-1/3 h-2 w-2 rounded-full bg-white/90" />
		<span className="absolute inset-x-0 bottom-3 mx-auto h-2 w-8 rounded-b-full border-b-4 border-white/90" />
	</span>
);

/** A streaming "who's watching?" screen you use directly: add profiles, pick a plan, start sharing. */
export const ProfilesScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const shown = Math.min(d.people, MAX_TILES);
	const custom = !t.presets.includes(d.total);

	return (
		<section className="px-4 py-10 text-white sm:py-14" style={{ background: `linear-gradient(180deg, ${t.theme.to}66, #141414 22rem), #141414` }}>
			<div className="mx-auto max-w-4xl text-center">
				<Crumb t={t} className="text-left" />
				<h1 className="mx-auto mt-6 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-5xl">Who’s sharing the plan?</h1>
				<p className="mt-3 text-lg text-white/90">
					<span className="text-white/60">Plan: </span>
					<TitleField d={d} placeholder="Netflix, Spotify…" className="text-center font-semibold" />
				</p>
				<p className="mx-auto mt-3 max-w-xl text-white/70 sm:text-lg">{t.sub}</p>

				<ul className="mt-10 flex flex-wrap justify-center gap-5" aria-label="Members">
					{Array.from({ length: shown }, (_, i) => (
						<li key={i} className="group relative w-24">
							<Face color={COLORS[i % COLORS.length]} />
							{i > 0 && (
								<button
									type="button"
									aria-label={`Remove member ${i + 1}`}
									onClick={() => d.setPeople(d.people - 1)}
									className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-[#141414] opacity-90 hover:opacity-100"
								>
									×
								</button>
							)}
							<p className="mt-2 text-sm text-white/85">
								{i === 0 ? <NameField d={d} placeholder="You" className="w-full text-center" /> : `Member ${i + 1}`}
							</p>
							<p className="text-sm font-semibold tabular-nums">{inr(each)}</p>
						</li>
					))}
					<li className="w-24">
						<button type="button" onClick={() => d.setPeople(d.people + 1)} aria-label="Add member" className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-white/30 text-4xl text-white/60 transition-colors hover:border-white hover:text-white">+</button>
						<p className="mt-2 text-sm text-white/60">Add profile</p>
					</li>
				</ul>
				{d.people > MAX_TILES && <p className="mt-3 text-sm text-white/60">+ {d.people - MAX_TILES} more members</p>}

				<p className="mt-12 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Choose the plan</p>
				<div className="mx-auto mt-3 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
					{t.presets.map((p, i) => (
						<button
							type="button"
							key={p}
							aria-pressed={d.total === p}
							onClick={() => d.setAmount(String(p))}
							className={`rounded-xl border-2 p-4 text-left transition-colors ${d.total === p ? "border-white bg-white/10" : "border-white/15 hover:border-white/40"}`}
						>
							<span className="block text-sm text-white/70">{PLANS[i] ?? "Plan"}</span>
							<span className="block font-display text-2xl font-semibold">{inr(p)}</span>
						</button>
					))}
					<div className={`rounded-xl border-2 p-4 text-left ${custom ? "border-white bg-white/10" : "border-white/15"}`}>
						<span className="block text-sm text-white/70">Other price</span>
						<InlineAmount d={d} label="Plan price" className="font-display text-2xl font-semibold" grow />
					</div>
				</div>

				<div className="mx-auto mt-10 flex max-w-2xl flex-col items-stretch gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:flex-row sm:items-center">
					<p className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm">
						<span className="shrink-0 text-white/60">Payments to</span>
						<UpiField d={d} grow className="text-base" />
					</p>
					<button type="submit" className="rounded-lg bg-white px-6 py-3 font-semibold text-[#141414] transition-transform hover:scale-[1.02] active:scale-95">
						▶ Start sharing
					</button>
				</div>
				<Note d={d} className="mt-3 text-center text-white" />
			</div>
		</section>
	);
};
