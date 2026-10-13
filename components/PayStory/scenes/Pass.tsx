"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { AmountInput, Barcode, Crumb, DetailsFields, ModeToggle, Presets, Stepper, inr, useTween, type SplitDraft } from "./shared";

/** A boarding pass for trips, a ride ticket for cabs, with a tear-off stub for each share. */
export const PassScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const total = useTween(d.total);
	const cab = t.id === "cab";
	const fg = t.theme.darkText ? "#1c1826" : "#fff";
	const bg = cab
		? "repeating-linear-gradient(180deg, #fde047 0 28px, transparent 28px 56px) left 10px top / 5px 100% no-repeat, repeating-linear-gradient(180deg, #fde047 0 28px, transparent 28px 56px) right 10px top / 5px 100% no-repeat, #22252b"
		: `radial-gradient(circle at 20% 20%, #ffffff40 0 2px, transparent 3px) 0 0 / 44px 44px, linear-gradient(160deg, ${t.theme.from}, ${t.theme.to})`;
	const field = (label: string, value: React.ReactNode) => (
		<div className="min-w-0">
			<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{label}</p>
			<p className="truncate font-display text-lg font-semibold text-ink">{value}</p>
		</div>
	);

	return (
		<section className="px-4 py-10 sm:py-14" style={{ background: bg }}>
			<div className="mx-auto max-w-4xl">
				<div className="text-white">
					<Crumb t={t} />
					<h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
					<p className="mt-3 max-w-xl text-white/85 sm:text-lg">{t.sub}</p>
				</div>

				{/* Ticket */}
				<div className="mt-8 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:flex-row" style={{ rotate: "-0.5deg" }}>
					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between px-5 py-3" style={{ background: `linear-gradient(90deg, ${t.theme.from}, ${t.theme.to})`, color: fg }}>
							<p className="text-xs font-bold uppercase tracking-[0.2em]">{cab ? "Ride ticket" : "Boarding pass"}</p>
							<p aria-hidden className="text-xl">{cab ? "🚕" : "✈️"}</p>
						</div>
						<div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
							{field("From", "You")}
							{field("To", d.title || t.label)}
							{field(cab ? "Riders" : "Passengers", d.even ? d.people : "Open")}
							{field("Fare", inr(total))}
							{field("Pay with", "UPI")}
							{field("Seat", d.even ? `1–${d.people}` : "Free")}
						</div>
					</div>
					{/* Perforation */}
					<div aria-hidden className="relative h-0 border-t-2 border-dashed border-line-strong sm:h-auto sm:w-0 sm:border-l-2 sm:border-t-0">
						<span className="absolute -left-3 -top-3 h-6 w-6 rounded-full" style={{ background: cab ? "#22252b" : t.theme.from }} />
						<span className="absolute -right-3 -top-3 h-6 w-6 rounded-full sm:-bottom-3 sm:-left-3 sm:right-auto sm:top-auto" style={{ background: cab ? "#22252b" : t.theme.to }} />
					</div>
					<div className="flex flex-col items-center justify-center gap-1 p-5 text-center sm:w-56">
						<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{d.even ? `Per ${t.who}` : "Goal"}</p>
						<p className="font-display text-4xl font-semibold tabular-nums text-ink" aria-live="polite">{inr(d.even ? each : total)}</p>
						<Barcode seed={t.id + d.people} className="mt-2 text-ink" />
					</div>
				</div>

				<div className="surface mt-8 grid gap-6 p-5 sm:p-6 md:grid-cols-2">
					<div className="min-w-0 space-y-4">
						<AmountInput d={d} label={cab ? "Total fare" : "Total to collect"} />
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
