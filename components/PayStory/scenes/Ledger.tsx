"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { AmountInput, Crumb, DetailsFields, ModeToggle, Presets, Stepper, inr, useTween, type SplitDraft } from "./shared";

const MAX_ROWS = 8;

/** A ruled ledger sheet with a row per person. Rent, utilities, anything else. */
export const LedgerScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const total = useTween(d.total);
	const fg = t.theme.darkText ? "#1c1826" : "#fff";
	const rows = d.even ? d.people : 3;
	const ruled = "repeating-linear-gradient(#fff 0 39px, #e7e3ea 39px 40px)";

	return (
		<>
			<section className="relative overflow-hidden px-4 pb-32 pt-10 sm:pt-14" style={{ background: t.theme.to, color: fg }}>
				<span aria-hidden className="pointer-events-none absolute -right-6 -top-10 select-none text-[11rem] opacity-25 sm:right-10 sm:text-[14rem]">{t.emoji}</span>
				<div className="relative mx-auto max-w-5xl">
					<Crumb t={t} />
					<h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
					<p className="mt-3 max-w-xl opacity-90 sm:text-lg">{t.sub}</p>
				</div>
			</section>

			<section className="px-4">
				<div className="surface relative z-10 mx-auto -mt-24 grid max-w-5xl overflow-hidden md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
					<div className="min-w-0 space-y-4 border-b border-line p-5 sm:p-6 md:border-b-0 md:border-r">
						<AmountInput d={d} label="Amount due" />
						<Presets t={t} d={d} />
						<ModeToggle t={t} d={d} />
						{d.even && <Stepper t={t} d={d} />}
					</div>

					{/* Ledger sheet */}
					<div className="relative min-w-0 p-5 sm:p-6" style={{ background: ruled }}>
						<span aria-hidden className="absolute inset-y-0 left-10 w-px bg-rose-300" />
						<div className="flex items-baseline justify-between gap-3 pl-8">
							<p className="truncate font-display text-xl font-semibold italic text-ink">{d.title || t.label}</p>
							<p className="label-text shrink-0">Ledger</p>
						</div>
						<table className="mt-3 w-full text-sm">
							<thead>
								<tr className="h-10 text-left text-ink-muted">
									<th className="pl-8 font-medium">{t.who[0].toUpperCase() + t.who.slice(1)}</th>
									<th className="font-medium">Share</th>
									<th className="text-right font-medium">Status</th>
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: Math.min(rows, MAX_ROWS) }, (_, i) => (
									<tr key={i} className="h-10">
										<td className="pl-8 text-ink">{i === 0 ? "You (organiser)" : `${t.who[0].toUpperCase() + t.who.slice(1)} ${i + 1}`}</td>
										<td className="tabular-nums text-ink">{d.even ? inr(each) : "Any"}</td>
										<td className="text-right">
											<span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: `${t.theme.from}1f`, color: t.theme.darkText ? "#7a5200" : t.theme.from }}>
												{i === 0 ? "Organiser" : "Due"}
											</span>
										</td>
									</tr>
								))}
								{rows > MAX_ROWS && (
									<tr className="h-10"><td colSpan={3} className="pl-8 text-ink-muted">+ {rows - MAX_ROWS} more</td></tr>
								)}
								<tr className="h-10 font-semibold text-ink">
									<td className="pl-8">Total</td>
									<td className="tabular-nums" colSpan={2}>{inr(total)}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div className="border-t border-line p-5 sm:p-6 md:col-span-2">
						<DetailsFields d={d} />
					</div>
				</div>
			</section>
		</>
	);
};
