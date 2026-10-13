"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { AmountInput, Barcode, Crumb, DetailsFields, ModeToggle, Presets, Stepper, inr, useTween, type SplitDraft } from "./shared";

const VENUE: Record<string, string> = { groceries: "FRESH MART", lunch: "OFFICE CANTEEN" };
const ZIGZAG = "conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 18px 100%";

/** A printed bill on a checked tablecloth. Dinner, lunch, groceries. */
export const ReceiptScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const total = useTween(d.total);
	const cloth = `repeating-linear-gradient(0deg, ${t.theme.from}12 0 22px, transparent 22px 44px), repeating-linear-gradient(90deg, ${t.theme.from}12 0 22px, transparent 22px 44px), #fbf8f3`;
	const row = "flex justify-between gap-4";

	return (
		<section className="px-4 py-10 sm:py-14" style={{ background: cloth }}>
			<div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div className="min-w-0 space-y-6">
					<div className="text-ink">
						<Crumb t={t} />
						<h1 className="mt-3 font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
						<p className="mt-3 max-w-xl text-ink-soft sm:text-lg">{t.sub}</p>
					</div>
					<div className="surface space-y-4 p-5">
						<AmountInput d={d} label="Bill total" />
						<Presets t={t} d={d} />
						<ModeToggle t={t} d={d} />
						{d.even && <Stepper t={t} d={d} />}
					</div>
					<div className="surface p-5">
						<DetailsFields d={d} />
					</div>
				</div>

				{/* The bill */}
				<div className="order-first lg:order-none lg:sticky lg:top-6" style={{ filter: "drop-shadow(0 18px 24px rgba(28,24,38,.18))" }}>
					<div
						className="mx-auto max-w-[340px] bg-white px-6 pb-12 pt-7 font-mono text-[13px] uppercase text-ink transition-transform hover:rotate-0"
						style={{ rotate: "-1.5deg", WebkitMask: ZIGZAG, mask: ZIGZAG }}
					>
						<p className="text-center text-lg font-bold tracking-[0.2em]">{VENUE[t.id] ?? "THE TABLE"}</p>
						<p className="mt-1 text-center text-[11px] text-ink-muted">{t.emoji} {d.even ? `${t.id === "groceries" ? "Shared by" : "Table for"} ${d.people}` : "Open contributions"}</p>
						<p className="mt-3 truncate text-center normal-case">{d.title || t.label}</p>
						<div className="my-3 border-t-2 border-dashed border-ink/30" />
						<p className={row}><span>Subtotal</span><span className="tabular-nums">{inr(total)}</span></p>
						<p className={row}><span>Split</span><span>{d.even ? `÷ ${d.people}` : "Any amount"}</span></p>
						{d.even && d.each * d.people !== d.total && d.total > 0 && (
							<p className={`${row} text-ink-muted`}><span>Round-up</span><span className="tabular-nums">+{inr(d.each * d.people - d.total)}</span></p>
						)}
						<div className="my-3 border-t-2 border-dashed border-ink/30" />
						<p className="text-center text-[11px] text-ink-muted">{d.even ? `Each ${t.who} pays` : "Goal"}</p>
						<p className="text-center font-display text-5xl font-semibold normal-case tabular-nums" aria-live="polite">
							{inr(d.even ? each : total)}
						</p>
						<div className="my-3 border-t-2 border-dashed border-ink/30" />
						<p className="text-center text-[11px]">Pay by UPI · No signup</p>
						<Barcode seed={t.id + d.total} className="mx-auto mt-3 w-fit text-ink" />
						<p className="mt-2 text-center text-[11px] text-ink-muted">Thank you, come again</p>
					</div>
				</div>
			</div>
		</section>
	);
};
