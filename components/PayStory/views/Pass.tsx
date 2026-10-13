"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { Barcode } from "../scenes/shared";
import { MarkPaid, PayButton, ShareBar, Trust, YourAmount, inr, type PayState } from "./shared";

const ROAD = "repeating-linear-gradient(180deg, #fde047 0 28px, transparent 28px 56px) left 10px top / 5px 100% no-repeat, repeating-linear-gradient(180deg, #fde047 0 28px, transparent 28px 56px) right 10px top / 5px 100% no-repeat, #22252b";
const MAX_SEATS = 24;

/** A seat map on the boarding pass (or ride ticket): seats fill in as people pay. */
export const PassView = ({ t, p }: { t: SplitTemplate; p: PayState }) => {
	const { req } = p;
	const cab = t.id === "cab";
	const fg = t.theme.darkText ? "#1c1826" : "#fff";
	const strip = `linear-gradient(90deg, ${t.theme.from}, ${t.theme.to})`;
	const bg = cab ? ROAD : `radial-gradient(circle at 20% 20%, #ffffff40 0 2px, transparent 3px) 0 0 / 44px 44px, linear-gradient(160deg, ${t.theme.from}, ${t.theme.to})`;
	const seats = Math.min(Math.max(req.people, req.paid.length + (p.done ? 0 : 1)), MAX_SEATS);
	const label = "text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted";

	return (
		<section className="min-h-[calc(100dvh-3.5rem)] px-4 py-8 sm:py-12" style={{ background: bg }}>
			<div className="mx-auto max-w-3xl">
				<div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:flex-row">
					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between px-5 py-3" style={{ background: strip, color: fg }}>
							<p className="text-xs font-bold uppercase tracking-[0.2em]">{cab ? "Ride ticket" : "Boarding pass"}</p>
							<p className="text-xs font-semibold">{p.done ? "ALL ABOARD ✓" : `${inr(p.remaining)} to go`}</p>
						</div>
						<div className="grid grid-cols-2 gap-x-6 gap-y-3 p-5 text-ink">
							<div className="min-w-0"><p className={label}>{cab ? "Ride to" : "Destination"}</p><p className="truncate font-display text-lg font-semibold">{req.title}</p></div>
							<div className="min-w-0"><p className={label}>Organiser</p><p className="truncate font-display text-lg font-semibold">{req.name}</p></div>
							<div><p className={label}>Total fare</p><p className="font-display text-lg font-semibold">{inr(req.target)}</p></div>
							<div><p className={label}>Collected</p><p className="font-display text-lg font-semibold">{inr(p.paid)}</p></div>
						</div>
						{/* Seat map: one seat per paying share */}
						<div className="border-t border-line px-5 pb-5 pt-4">
							<p className={label}>{cab ? "Riders" : "Seats"}</p>
							<ul className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
								{Array.from({ length: seats }, (_, i) => {
									const payer = req.paid[i];
									const filled = Boolean(payer);
									return (
										<li key={i} className="flex flex-col items-center gap-1 rounded-lg border p-1.5 text-center" style={filled ? { background: strip, color: fg, borderColor: "transparent" } : { borderColor: "#e7e3ea" }}>
											<span className="text-[10px] font-bold">{String.fromCharCode(65 + (i % 6))}{Math.floor(i / 6) + 1}</span>
											<span className="w-full truncate text-xs">{payer ? payer[0] : "Free"}</span>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
					<div aria-hidden className="border-t-2 border-dashed border-line-strong sm:border-l-2 sm:border-t-0" />
					<div className="flex flex-col items-center justify-center gap-3 p-5 text-center text-ink sm:w-64">
						{p.done ? (
							<p className="font-display text-2xl font-semibold">Everyone’s paid 🎉</p>
						) : (
							<>
								<p className={label}>{p.share ? `Your fare` : "Your amount"}</p>
								<p className="font-display text-4xl font-semibold"><YourAmount p={p} /></p>
								<PayButton p={p} className="w-full rounded-xl py-3" style={{ background: strip, color: fg }}>Pay & board →</PayButton>
								<MarkPaid p={p} className="w-full" btnClass="text-white" btnStyle={{ background: t.theme.to }} />
							</>
						)}
						<Barcode seed={t.id + req.target} className="text-ink" />
					</div>
				</div>
				<ShareBar p={p} t={t} className="mt-5" primary="bg-white text-ink" secondary="border border-white/40 text-white" />
				<Trust p={p} className="mt-3 text-center text-white" />
			</div>
		</section>
	);
};
