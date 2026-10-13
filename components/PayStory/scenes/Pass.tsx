"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { Barcode, Counter, Crumb, InlineAmount, ModeSwitch, NameField, Note, TitleField, UpiField, inr, useTween, type SplitDraft } from "./shared";

const ROAD = "repeating-linear-gradient(180deg, #fde047 0 28px, transparent 28px 56px) left 10px top / 5px 100% no-repeat, repeating-linear-gradient(180deg, #fde047 0 28px, transparent 28px 56px) right 10px top / 5px 100% no-repeat, #22252b";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<div className="min-w-0">
		<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{label}</p>
		<div className="mt-0.5 font-display text-lg font-semibold text-ink">{children}</div>
	</div>
);

/** Fill in the boarding pass (or ride ticket) itself, then issue it. Trip, cab. */
export const PassScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const cab = t.id === "cab";
	const fg = t.theme.darkText ? "#1c1826" : "#fff";
	const bg = cab ? ROAD : `radial-gradient(circle at 20% 20%, #ffffff40 0 2px, transparent 3px) 0 0 / 44px 44px, linear-gradient(160deg, ${t.theme.from}, ${t.theme.to})`;
	const strip = `linear-gradient(90deg, ${t.theme.from}, ${t.theme.to})`;

	return (
		<section className="px-4 py-10 sm:py-14" style={{ background: bg }}>
			<div className="mx-auto max-w-4xl">
				<div className="text-white">
					<Crumb t={t} />
					<h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
					<p className="mt-3 max-w-xl text-white/85 sm:text-lg">{t.sub}</p>
				</div>

				<div className="mt-8 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:flex-row">
					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between gap-3 px-5 py-3" style={{ background: strip, color: fg }}>
							<p className="text-xs font-bold uppercase tracking-[0.2em]">{cab ? "Ride ticket" : "Boarding pass"}</p>
							<ModeSwitch d={d} labels={["Equal fare", "Any amount"]} className="bg-black/15" on="bg-white text-ink" off="opacity-80" />
						</div>
						<div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
							<Field label="Passenger (you)"><NameField d={d} grow /></Field>
							<Field label={cab ? "Ride to" : "Destination"}><TitleField d={d} grow /></Field>
							<Field label="Fare"><InlineAmount d={d} label={cab ? "Total fare" : "Total to collect"} /></Field>
							<Field label={cab ? "Riders" : "Travellers"}>
								{d.even ? <Counter t={t} d={d} btn="border border-line-strong text-base hover:bg-paper" /> : "Open"}
							</Field>
							<div className="sm:col-span-2"><Field label="Pay to UPI"><UpiField d={d} grow /></Field></div>
						</div>
					</div>
					<div aria-hidden className="border-t-2 border-dashed border-line-strong sm:border-l-2 sm:border-t-0" />
					<div className="flex flex-col items-center justify-center gap-2 p-5 text-center sm:w-60">
						<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{d.even ? `Per ${t.who}` : "Goal"}</p>
						<p className="font-display text-4xl font-semibold tabular-nums text-ink" aria-live="polite">{inr(d.even ? each : d.total)}</p>
						<Barcode seed={t.id + d.people} className="text-ink" />
						<button type="submit" className="mt-2 w-full rounded-xl py-3 font-semibold transition-transform active:scale-95" style={{ background: strip, color: fg }}>
							{cab ? "Issue ride tickets" : "Issue boarding passes"} →
						</button>
					</div>
				</div>
				<Note d={d} className="mt-3 text-center text-white" />
			</div>
		</section>
	);
};
