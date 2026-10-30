"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, IndianRupee } from "lucide-react";
import { DEFAULT_CURRENCY } from "@/constants";
import { formatCurrency } from "@/utils/formatting";
import { localCurrency } from "@/utils/localCurrency";

// The same trip at a believable size in each currency: total, then the two payments.
const AMOUNTS: Record<string, [number, number, number]> = {
	INR: [38460, 6215, 2940],
	JPY: [69200, 11180, 5290],
};
const OTHER: [number, number, number] = [462, 74.6, 35.3];

/**
 * A faithful, static preview of the settle-up screen, in the visitor's own currency.
 * Rupees show the UPI pay button the app shows; other currencies show Mark as paid,
 * as the app does. Renders rupees on the server, then the local currency.
 */
export const SettlementPreview = () => {
	const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
	useEffect(() => setCurrency(localCurrency()), []);
	const [total, first, second] = AMOUNTS[currency.code] ?? OTHER;
	const money = (n: number) => formatCurrency(n, currency);
	const upi = currency.code === "INR";

	return (
		<div className="relative mx-auto w-full max-w-sm" aria-hidden>
			<div className="surface shadow-raised p-4 sm:p-5">
				<div className="flex items-start justify-between">
					<div>
						<p className="font-display text-xl font-semibold text-ink">Weekend trip</p>
						<p className="text-sm text-ink-muted">4 members · 11 expenses</p>
					</div>
					<div className="text-right">
						<p className="text-sm text-ink-muted">Total</p>
						<p className="font-semibold tabular-nums text-ink">{money(total)}</p>
					</div>
				</div>
				<div className="mt-4 space-y-2.5 border-t border-line pt-4">
					{[
						["Rohan", "Priya", first],
						["Aisha", "Priya", second],
					].map(([from, to, amt], i) => (
						<div key={from} className="rounded-xl border border-line p-3">
							<div className="flex items-center justify-between gap-2">
								<span className="flex items-center gap-1.5 font-semibold text-ink">
									{from}
									<ArrowRight className="h-3.5 w-3.5 text-ink-muted" />
									{to}
								</span>
								<span className="font-semibold tabular-nums text-ink">{money(amt as number)}</span>
							</div>
							{i === 0 && (
								<div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-brand-700 py-2 text-sm font-semibold text-on-brand">
									{upi ? (
										<>
											<IndianRupee className="h-3.5 w-3.5" />
											Pay {to} {money(amt as number)}
										</>
									) : (
										<>
											<Check className="h-3.5 w-3.5" />
											Mark as paid
										</>
									)}
								</div>
							)}
						</div>
					))}
				</div>
			</div>
			<div className="surface absolute -bottom-5 -left-3 sm:-left-8 hidden sm:flex items-center gap-2 px-3 py-2 shadow-raised">
				<span className="flex h-6 w-6 items-center justify-center rounded-full bg-positive-soft">
					<Check className="h-3.5 w-3.5 text-positive" strokeWidth={3} />
				</span>
				<span className="text-sm font-medium text-ink">2 payments settle it</span>
			</div>
		</div>
	);
};
