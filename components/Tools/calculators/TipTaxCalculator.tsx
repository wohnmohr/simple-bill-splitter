"use client";

import { useMemo, useState } from "react";
import {
	CalculatorResult,
	CurrencySelect,
	fieldClass,
	labelClass,
	makeEqualExpense,
	makePeople,
	useDefaultCurrency,
} from "./shared";

type Mode = "tip" | "tax";

export const TipTaxCalculator = ({ mode }: { mode: Mode }) => {
	const [currency, setCurrency] = useDefaultCurrency("USD");
	const [subtotal, setSubtotal] = useState(mode === "tip" ? "86.40" : "120.00");
	const [rate, setRate] = useState(mode === "tip" ? "18" : "8.875");
	const [useFinal, setUseFinal] = useState(false);
	const [finalTotal, setFinalTotal] = useState("");
	const [peopleCount, setPeopleCount] = useState("4");
	const [names, setNames] = useState("");
	const [payerIndex, setPayerIndex] = useState(0);

	const presets = mode === "tip" ? ["10", "15", "18", "20", "25"] : ["5", "8", "10", "12", "18"];

	const count = Math.max(2, Math.min(20, parseInt(peopleCount, 10) || 2));
	const base = parseFloat(subtotal) || 0;
	const pct = parseFloat(rate) || 0;
	const added = (base * pct) / 100;
	const computedTotal = Math.round((base + added) * 100) / 100;
	const total = useFinal
		? Math.round((parseFloat(finalTotal) || 0) * 100) / 100
		: computedTotal;

	const people = useMemo(() => {
		const custom = names
			.split(",")
			.map((n) => n.trim())
			.filter(Boolean);
		if (custom.length >= 2) return makePeople(custom.slice(0, 20));
		return makePeople(
			Array.from({ length: count }, (_, i) => `Person ${i + 1}`)
		);
	}, [names, count]);

	const paidBy = people[Math.min(payerIndex, people.length - 1)]?.id || people[0].id;
	const label = mode === "tip" ? "Tip" : "Tax";
	const expenses =
		total > 0
			? [makeEqualExpense(total, people, paidBy, `Bill with ${label.toLowerCase()}`)]
			: [];

	return (
		<div className="grid lg:grid-cols-2 gap-6">
			<div className="space-y-4 rounded-2xl bg-white/80 border border-white/60 shadow-md p-4 sm:p-5">
				<label className="flex items-center gap-2 text-sm text-gray-700">
					<input
						type="checkbox"
						checked={useFinal}
						onChange={(e) => setUseFinal(e.target.checked)}
						className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
					/>
					I already have the final total (skip {label.toLowerCase()} %)
				</label>

				{useFinal ? (
					<div>
						<label className={labelClass}>Final total</label>
						<div className="flex gap-2">
							<input
								className={fieldClass}
								inputMode="decimal"
								value={finalTotal}
								onChange={(e) => setFinalTotal(e.target.value)}
							/>
							<div className="w-28 shrink-0">
								<CurrencySelect value={currency} onChange={setCurrency} />
							</div>
						</div>
					</div>
				) : (
					<>
						<div>
							<label className={labelClass}>
								{mode === "tip" ? "Bill before tip" : "Subtotal before tax"}
							</label>
							<div className="flex gap-2">
								<input
									className={fieldClass}
									inputMode="decimal"
									value={subtotal}
									onChange={(e) => setSubtotal(e.target.value)}
								/>
								<div className="w-28 shrink-0">
									<CurrencySelect value={currency} onChange={setCurrency} />
								</div>
							</div>
						</div>
						<div>
							<label className={labelClass}>{label} percentage</label>
							<input
								className={fieldClass}
								inputMode="decimal"
								value={rate}
								onChange={(e) => setRate(e.target.value)}
							/>
							<div className="flex flex-wrap gap-1.5 mt-2">
								{presets.map((p) => (
									<button
										key={p}
										type="button"
										onClick={() => setRate(p)}
										className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
									>
										{p}%
									</button>
								))}
							</div>
							<p className="text-xs text-gray-500 mt-2">
								{label} amount: {currency.symbol}
								{added.toFixed(2)} → total {currency.symbol}
								{computedTotal.toFixed(2)}
							</p>
						</div>
					</>
				)}

				<div>
					<label className={labelClass}>People</label>
					<input
						className={fieldClass}
						inputMode="numeric"
						value={peopleCount}
						onChange={(e) => setPeopleCount(e.target.value)}
					/>
				</div>

				<div>
					<label className={labelClass}>Names (optional)</label>
					<input
						className={fieldClass}
						value={names}
						onChange={(e) => setNames(e.target.value)}
						placeholder="Alex, Sam, Jordan, …"
					/>
				</div>

				<div>
					<label className={labelClass}>Who paid?</label>
					<select
						className={fieldClass}
						value={Math.min(payerIndex, people.length - 1)}
						onChange={(e) => setPayerIndex(parseInt(e.target.value, 10))}
					>
						{people.map((p, i) => (
							<option key={p.id} value={i}>
								{p.name}
							</option>
						))}
					</select>
				</div>
			</div>

			<CalculatorResult
				title={`${label}-inclusive split`}
				people={people}
				expenses={expenses}
				currency={currency}
				tool={mode === "tip" ? "split-bill-with-tip" : "split-bill-with-tax"}
			/>
		</div>
	);
};
