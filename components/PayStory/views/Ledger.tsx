"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { MarkPaid, PayButton, ShareBar, Trust, YourAmount, inr, type PayState } from "./shared";

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const MAX_ROWS = 12;

/** The ledger sheet, with each payment ticked off and a SETTLED stamp when it's done. */
export const LedgerView = ({ t, p }: { t: SplitTemplate; p: PayState }) => {
	const { req } = p;
	const fg = t.theme.darkText ? "#1c1826" : "#fff";
	const ink = t.theme.darkText ? "#7a5200" : t.theme.to;
	const paper = "repeating-linear-gradient(#fffdf8 0 43px, #e7e3ea 43px 44px)";
	const open = p.share ? Math.max(req.people - req.paid.length, 0) : 0;

	return (
		<>
			<section className="px-4 pb-28 pt-8 sm:pt-12" style={{ background: t.theme.to, color: fg }}>
				<div className="mx-auto max-w-3xl">
					<p className="text-sm opacity-80">{t.emoji} {t.label} · from {req.name}</p>
					<h1 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">{req.title}</h1>
					<p className="mt-2 opacity-90">{p.done ? "All settled." : `${inr(p.remaining)} still to collect`}</p>
				</div>
			</section>
			<section className="min-h-[calc(100dvh-20rem)] px-4 pb-8">
				<div className="relative z-10 mx-auto -mt-20 max-w-3xl overflow-hidden rounded-2xl shadow-2xl" style={{ background: paper }}>
					<span aria-hidden className="absolute inset-y-0 left-10 w-px bg-rose-300 sm:left-14" />
					{p.done && (
						<span aria-hidden className="pointer-events-none absolute right-6 top-6 rotate-[-12deg] rounded-lg border-4 px-3 py-1 font-display text-2xl font-bold uppercase tracking-[0.15em] opacity-80" style={{ borderColor: ink, color: ink }}>Settled</span>
					)}
					<div className="py-6 pl-14 pr-5 text-ink sm:pl-20 sm:pr-8">
						<table className="w-full text-sm">
							<thead>
								<tr className="h-11 text-left text-xs uppercase tracking-[0.08em] text-ink-muted">
									<th className="font-medium">{cap(t.who)}</th><th className="font-medium">Amount</th><th className="text-right font-medium">Status</th>
								</tr>
							</thead>
							<tbody>
								<tr className="h-11"><td>{req.name}</td><td className="text-ink-muted">Organiser</td><td /></tr>
								{req.paid.slice(0, MAX_ROWS).map(([n, a], i) => (
									<tr key={i} className="h-11">
										<td>{n}</td><td className="tabular-nums">{inr(a)}</td>
										<td className="text-right"><span className="rounded-full bg-positive-soft px-2 py-0.5 text-xs font-semibold text-positive">Paid ✓</span></td>
									</tr>
								))}
								{Array.from({ length: Math.min(open, MAX_ROWS) }, (_, i) => (
									<tr key={`o${i}`} className="h-11 text-ink-muted">
										<td>{cap(t.who)} …</td><td className="tabular-nums">{inr(p.share)}</td>
										<td className="text-right"><span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: `${ink}1a`, color: ink }}>Due</span></td>
									</tr>
								))}
								<tr className="h-11 font-semibold"><td>Collected</td><td colSpan={2} className="tabular-nums">{inr(p.paid)} of {inr(req.target)}</td></tr>
							</tbody>
						</table>

						{!p.done && (
							<div className="mt-4 space-y-4">
								<p className="flex flex-wrap items-baseline gap-2 font-display text-2xl font-semibold">
									<span className="text-base font-normal text-ink-muted">You pay</span><YourAmount p={p} />
								</p>
								<PayButton p={p} className="rotate-[-1.5deg] rounded-lg border-[3px] px-5 py-2.5 font-display text-lg uppercase tracking-[0.1em] hover:rotate-0" style={{ borderColor: ink, color: ink }}>
									Pay {p.amt ? inr(p.amt) : ""} by UPI
								</PayButton>
								<MarkPaid p={p} btnClass="text-white" btnStyle={{ background: ink }} />
							</div>
						)}
						<ShareBar p={p} t={t} className="mt-6" primary="text-white" primaryStyle={{ background: ink }} secondary="border border-ink/20 bg-white" />
						<Trust p={p} className="mt-3" />
					</div>
				</div>
			</section>
		</>
	);
};
