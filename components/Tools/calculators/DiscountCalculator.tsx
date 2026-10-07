"use client";

import { useState } from "react";
import { CurrencySelect, fieldClass, labelClass, useDefaultCurrency, useEngaged, useTrackResult } from "./shared";
import { formatCurrency } from "@/utils/formatting";

const TOOL = "discount-calculator";
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Applies one or two successive percentage discounts. */
export function computeDiscount(price: number, first: number, second: number) {
	const afterFirst = price * (1 - first / 100);
	const final = afterFirst * (1 - second / 100);
	const saved = price - final;
	return { final: round2(final), saved: round2(saved), effective: price > 0 ? round2((saved / price) * 100) : 0 };
}

export const DiscountCalculator = () => {
	const [currency, setCurrency] = useDefaultCurrency("INR");
	const [price, setPrice] = useState("2499");
	const [off, setOff] = useState("30");
	const [extra, setExtra] = useState("10");
	const [people, setPeople] = useState("1");
	const engaged = useEngaged(TOOL);

	const p = parseFloat(price) || 0;
	const count = Math.max(1, Math.min(50, parseInt(people, 10) || 1));
	const clamp = (v: string) => Math.min(100, Math.max(0, parseFloat(v) || 0));
	const { final, saved, effective } = computeDiscount(p, clamp(off), clamp(extra));
	useTrackResult(TOOL, p > 0);
	const fmt = (n: number) => formatCurrency(n, currency);

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<div className="surface space-y-4 p-4 sm:p-5">
				<div>
					<label className={labelClass} htmlFor="disc-price">
						Original price
					</label>
					<div className="flex gap-2">
						<input
							id="disc-price"
							className={fieldClass}
							inputMode="decimal"
							value={price}
							onChange={(e) => {
								engaged();
								setPrice(e.target.value);
							}}
						/>
						<div className="w-28 shrink-0">
							<CurrencySelect value={currency} onChange={setCurrency} />
						</div>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className={labelClass} htmlFor="disc-off">
							Discount (%)
						</label>
						<input id="disc-off" className={fieldClass} inputMode="decimal" value={off} onChange={(e) => { engaged(); setOff(e.target.value); }} />
					</div>
					<div>
						<label className={labelClass} htmlFor="disc-extra">
							Extra off (%)
						</label>
						<input id="disc-extra" className={fieldClass} inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} />
					</div>
				</div>
				<div>
					<label className={labelClass} htmlFor="disc-people">
						Split between (people)
					</label>
					<input id="disc-people" className={fieldClass} inputMode="numeric" value={people} onChange={(e) => setPeople(e.target.value)} />
				</div>
			</div>

			<div className="surface shadow-raised p-4 sm:p-5">
				<p className="label-text">You pay</p>
				<p className="font-display text-4xl font-semibold text-ink tabular-nums">{fmt(final)}</p>
				<div className="mt-3 divide-y divide-line text-sm">
					<div className="flex justify-between py-2 text-gray-700">
						<span>You save</span>
						<span className="font-semibold text-positive tabular-nums">{fmt(saved)}</span>
					</div>
					<div className="flex justify-between py-2 text-gray-700">
						<span>Effective discount</span>
						<span className="tabular-nums">{effective}%</span>
					</div>
					{count > 1 && (
						<div className="flex justify-between py-2 font-semibold text-ink">
							<span>Each of {count} pays</span>
							<span className="tabular-nums">{fmt(round2(final / count))}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
