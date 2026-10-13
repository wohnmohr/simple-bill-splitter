"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { MarkPaid, PayButton, ShareBar, Trust, YourAmount, inr, type PayState } from "./shared";

const LED = "#fde047";
const JERSEY = "polygon(22% 0, 38% 0, 50% 10%, 62% 0, 78% 0, 100% 18%, 86% 36%, 80% 32%, 80% 100%, 20% 100%, 20% 32%, 14% 36%, 0 18%)";
const MAX_JERSEYS = 24;

/** The scoreboard counts collections; jerseys get a name as each player pays. */
export const ScoreboardView = ({ t, p }: { t: SplitTemplate; p: PayState }) => {
	const { req } = p;
	const turf = "repeating-linear-gradient(90deg, #2f7d32 0 64px, #2a7030 64px 128px)";
	const led = { color: LED, textShadow: `0 0 10px ${LED}99` };
	const players = Math.min(Math.max(req.people, req.paid.length + (p.done ? 0 : 1)), MAX_JERSEYS);
	const cell = (l: string, v: string) => (
		<div className="min-w-0 px-2 py-2 text-center">
			<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{l}</p>
			<p className="mt-1 truncate font-mono text-xl font-bold tabular-nums sm:text-3xl" style={led}>{v}</p>
		</div>
	);

	return (
		<section className="min-h-[calc(100dvh-3.5rem)] px-4 py-8 sm:py-12" style={{ background: turf }}>
			<div className="mx-auto max-w-3xl">
				<div className="rounded-2xl border-4 border-zinc-700 bg-[#0b0b0d] p-3 shadow-2xl">
					<p className="truncate text-center font-mono text-sm uppercase tracking-[0.25em] text-white/80">{req.title} · Captain {req.name}</p>
					<div className="mt-2 grid grid-cols-3 divide-x divide-white/10">
						{cell("Collected", inr(p.paid))}
						{cell("To go", inr(p.remaining))}
						{cell("Match fee", p.share ? inr(p.share) : "Any")}
					</div>
				</div>

				<ul className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6">
					{Array.from({ length: players }, (_, i) => {
						const payer = req.paid[i];
						const paid = Boolean(payer);
						return (
							<li key={i} className="flex flex-col items-center">
								<span className="flex aspect-square w-full max-w-[64px] items-center justify-center pt-2 font-mono text-lg font-bold text-white" style={{ clipPath: JERSEY, background: paid ? (i % 2 ? t.theme.to : t.theme.from) : "rgba(255,255,255,.18)" }}>
									{paid ? "✓" : i + 1}
								</span>
								<span className="mt-1 w-full truncate text-center text-xs font-semibold text-white">{payer ? payer[0] : "Unpaid"}</span>
							</li>
						);
					})}
				</ul>

				<div className="mx-auto mt-8 max-w-md rotate-[0.6deg] rounded-xl bg-[#fffdf5] p-5 text-ink shadow-xl">
					{p.done ? (
						<p className="text-center font-display text-2xl font-semibold">Full time: everyone’s paid 🏆</p>
					) : (
						<div className="space-y-3 text-center">
							<p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">{p.share ? "Your match fee" : "Your amount"}</p>
							<p className="font-display text-4xl font-semibold"><YourAmount p={p} /></p>
							<PayButton p={p} className="w-full rounded-xl bg-[#14532d] py-3 text-white">Pay {p.amt ? inr(p.amt) : ""} and take the field</PayButton>
							<MarkPaid p={p} btnClass="bg-[#14532d] text-white" />
						</div>
					)}
					<ShareBar p={p} t={t} className="mt-4" primary="bg-[#14532d] text-white" secondary="border border-ink/20" />
					<Trust p={p} className="mt-3 text-center" />
				</div>
			</div>
		</section>
	);
};
