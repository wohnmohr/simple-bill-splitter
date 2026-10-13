"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { Barcode, Counter, Crumb, InlineAmount, ModeSwitch, NameField, Note, TitleField, UpiField, inr, useTween, type SplitDraft } from "./shared";

const VENUE: Record<string, string> = { groceries: "FRESH MART", lunch: "OFFICE CANTEEN" };
const ZIGZAG = "conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 18px 100%";

/** The bill is the interface: write on it, then print the link. Dinner, lunch, groceries. */
export const ReceiptScene = ({ t, d }: { t: SplitTemplate; d: SplitDraft }) => {
	const each = useTween(d.each);
	const cloth = `repeating-linear-gradient(0deg, ${t.theme.from}12 0 22px, transparent 22px 44px), repeating-linear-gradient(90deg, ${t.theme.from}12 0 22px, transparent 22px 44px), #fbf8f3`;
	const row = "flex items-center justify-between gap-4";
	const rule = <div className="my-3 border-t-2 border-dashed border-ink/30" />;

	return (
		<section className="px-4 py-10 sm:py-14" style={{ background: cloth }}>
			<div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14">
				<div className="min-w-0 text-ink">
					<Crumb t={t} />
					<h1 className="mt-3 font-display text-3xl font-semibold leading-tight [text-wrap:balance] sm:text-5xl">{t.headline}</h1>
					<p className="mt-3 max-w-xl text-ink-soft sm:text-lg">{t.sub}</p>
					<p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm text-ink-soft shadow-sm">
						<span aria-hidden>✍️</span> Tap the bill to fill it in
					</p>
				</div>

				<div style={{ filter: "drop-shadow(0 18px 24px rgba(28,24,38,.18))" }}>
					<div
						className="mx-auto max-w-[380px] bg-white px-6 pb-12 pt-7 font-mono text-[13px] uppercase text-ink"
						style={{ rotate: "-1deg", WebkitMask: ZIGZAG, mask: ZIGZAG }}
					>
						<p className="text-center text-lg font-bold tracking-[0.2em]">{VENUE[t.id] ?? "THE TABLE"}</p>
						<div className="mt-2 flex justify-center">
							<ModeSwitch d={d} labels={["Split evenly", "Any amount"]} className="bg-ink/5 normal-case" on="bg-ink text-white" off="text-ink-muted" />
						</div>
						<div className="mt-3 flex justify-center"><TitleField d={d} className="text-center normal-case" /></div>
						{rule}
						<p className={row}><span>Subtotal</span><InlineAmount d={d} label="Bill total" className="text-right" /></p>
						{d.even ? (
							<p className={`${row} mt-1`}>
								<span>{t.id === "groceries" ? "Shared by" : "Guests"}</span>
								<Counter t={t} d={d} btn="border border-ink/25 hover:bg-ink/5" />
							</p>
						) : (
							<p className={`${row} mt-1`}><span>Split</span><span>Any amount</span></p>
						)}
						{d.even && d.each * d.people !== d.total && d.total > 0 && (
							<p className={`${row} text-ink-muted`}><span>Round-up</span><span className="tabular-nums">+{inr(d.each * d.people - d.total)}</span></p>
						)}
						{rule}
						<p className="text-center text-[11px] text-ink-muted">{d.even ? `Each ${t.who} pays` : "Goal"}</p>
						<p className="text-center font-display text-5xl font-semibold normal-case tabular-nums" aria-live="polite">
							{inr(d.even ? each : d.total)}
						</p>
						{rule}
						<p className={row}><span>Pay to</span><NameField d={d} className="text-right normal-case" /></p>
						<p className={`${row} mt-1`}><span>UPI</span><UpiField d={d} className="text-right" /></p>
						<button type="submit" className="mt-5 w-full bg-ink py-3 text-center font-mono text-sm font-bold tracking-[0.15em] text-white transition-transform active:scale-[.98]">
							PRINT SPLIT LINK ▸
						</button>
						<Note d={d} className="mt-2 text-center normal-case text-ink" />
						<Barcode seed={t.id + d.total} className="mx-auto mt-4 w-fit text-ink" />
					</div>
				</div>
			</div>
		</section>
	);
};
