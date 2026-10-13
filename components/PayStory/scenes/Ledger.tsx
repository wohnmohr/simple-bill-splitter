"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { Crumb, InlineAmount, ModeSwitch, NameField, Note, TitleField, UpiField, inr, useTween, type SplitDraft } from "./shared";

const MAX_ROWS = 10;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** A ruled ledger sheet you fill in directly: rows, total and signature. Rent, utilities, anything. */
export const LedgerScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const fg = t.theme.darkText ? "#1c1826" : "#fff";
	const rows = d.even ? d.people : 3;
	const paper = "repeating-linear-gradient(#fffdf8 0 43px, #e7e3ea 43px 44px)";
	const ink = t.theme.darkText ? "#7a5200" : t.theme.to;

	return (
		<>
			<section className="relative overflow-hidden px-4 pb-32 pt-10 sm:pt-14" style={{ background: t.theme.to, color: fg }}>
				<span aria-hidden className="pointer-events-none absolute -right-6 -top-10 select-none text-[11rem] opacity-25 sm:right-10 sm:text-[14rem]">{t.emoji}</span>
				<div className="relative mx-auto max-w-3xl">
					<Crumb t={t} />
					<h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
					<p className="mt-3 max-w-xl opacity-90 sm:text-lg">{t.sub}</p>
				</div>
			</section>

			<section className="px-4 pb-4">
				<div className="relative z-10 mx-auto -mt-24 max-w-3xl overflow-hidden rounded-2xl shadow-2xl" style={{ background: paper }}>
					<span aria-hidden className="absolute inset-y-0 left-10 w-px bg-rose-300 sm:left-14" />
					<div className="space-y-1 py-6 pl-14 pr-5 sm:pl-20 sm:pr-8">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<TitleField d={d} className="font-display text-2xl font-semibold italic text-ink sm:text-3xl" />
							<ModeSwitch d={d} className="bg-ink/5" on="text-white" onStyle={{ background: ink }} off="text-ink-muted" />
						</div>

						<table className="w-full text-sm text-ink">
							<thead>
								<tr className="h-11 text-left text-xs uppercase tracking-[0.08em] text-ink-muted">
									<th className="font-medium">{cap(t.who)}</th>
									<th className="font-medium">Share</th>
									<th className="w-10" />
								</tr>
							</thead>
							<tbody>
								{Array.from({ length: Math.min(rows, MAX_ROWS) }, (_, i) => (
									<tr key={i} className="h-11">
										<td>{i === 0 ? "You" : `${cap(t.who)} ${i + 1}`}</td>
										<td className="tabular-nums">{d.even ? inr(each) : <span className="text-ink-muted">Any amount</span>}</td>
										<td className="text-right">
											{d.even && i > 0 && (
												<button type="button" aria-label={`Remove ${t.who} ${i + 1}`} onClick={() => d.setPeople(d.people - 1)} className="h-7 w-7 rounded-full text-ink-muted hover:bg-ink/5 hover:text-ink">×</button>
											)}
										</td>
									</tr>
								))}
								{rows > MAX_ROWS && <tr className="h-11"><td colSpan={3} className="text-ink-muted">+ {rows - MAX_ROWS} more</td></tr>}
								{d.even && (
									<tr className="h-11">
										<td colSpan={3}>
											<button type="button" onClick={() => d.setPeople(d.people + 1)} className="font-semibold hover:underline" style={{ color: ink }}>+ Add {t.who}</button>
										</td>
									</tr>
								)}
								<tr className="h-11 font-semibold">
									<td>Total</td>
									<td colSpan={2} className="font-display text-xl"><InlineAmount d={d} label="Total amount" /></td>
								</tr>
							</tbody>
						</table>

						<div className="grid gap-x-6 pt-2 text-sm text-ink sm:grid-cols-2">
							<p className="flex h-11 items-center gap-2"><span className="shrink-0 text-ink-muted">Collected by</span><NameField d={d} grow className="font-display text-lg italic" /></p>
							<p className="flex h-11 items-center gap-2"><span className="shrink-0 text-ink-muted">UPI ID</span><UpiField d={d} grow /></p>
						</div>

						<div className="flex flex-wrap items-center gap-4 pt-4">
							<button
								type="submit"
								className="rotate-[-2deg] rounded-lg border-[3px] px-5 py-2.5 font-display text-lg font-semibold uppercase tracking-[0.1em] transition-transform hover:rotate-0 active:scale-95"
								style={{ borderColor: ink, color: ink }}
							>
								Send to {t.who}s ✓
							</button>
							<Note d={d} className="min-w-0 flex-1 text-ink" />
						</div>
					</div>
				</div>
			</section>
		</>
	);
};
