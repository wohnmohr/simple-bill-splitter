"use client";

import { useMemo, useState } from "react";
import { Expense } from "@/types";
import {
	CalculatorResult,
	CurrencySelect,
	fieldClass,
	labelClass,
	makePeople,
	useDefaultCurrency,
} from "./shared";

type ShareMode = "amount" | "percent";

/** Unequal split by exact amounts or percentages */
export const UnequalCalculator = () => {
	const [currency, setCurrency] = useDefaultCurrency("USD");
	const [total, setTotal] = useState("240");
	const [mode, setMode] = useState<ShareMode>("amount");
	const [rows, setRows] = useState([
		{ name: "Alex", share: "95" },
		{ name: "Sam", share: "70" },
		{ name: "Jordan", share: "75" },
	]);
	const [payerIndex, setPayerIndex] = useState(0);

	const bill = parseFloat(total) || 0;

	const people = useMemo(
		() => makePeople(rows.map((r) => r.name || "Person")),
		[rows]
	);

	const shares = rows.map((r) => parseFloat(r.share) || 0);
	const shareSum = shares.reduce((a, b) => a + b, 0);

	const amounts =
		mode === "amount"
			? shares
			: shares.map((pct) =>
					shareSum > 0 ? (bill * pct) / shareSum : 0
				);

	const amountSum = amounts.reduce((a, b) => a + b, 0);
	const balanced =
		mode === "amount"
			? Math.abs(amountSum - bill) < 0.02
			: Math.abs(shareSum - 100) < 0.05 || shareSum > 0;

	const paidBy = people[Math.min(payerIndex, people.length - 1)]?.id;

	const expenses: Expense[] =
		bill > 0 && people.length >= 2 && paidBy
			? [
					{
						id: "exp-1",
						amount: mode === "amount" ? amountSum || bill : bill,
						paidBy,
						participants: people.map((p) => p.id),
						description: "Unequal split",
						splitMethod: "percentage",
						percentages: Object.fromEntries(
							people.map((p, i) => {
								const amt = amounts[i] || 0;
								const basis = mode === "amount" ? amountSum || bill : bill;
								return [p.id, basis > 0 ? (amt / basis) * 100 : 0];
							})
						),
					},
				]
			: [];

	const updateRow = (index: number, patch: Partial<(typeof rows)[0]>) => {
		setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
	};

	return (
		<div className="grid lg:grid-cols-2 gap-6">
			<div className="space-y-4 rounded-2xl bg-white/80 border border-white/60 shadow-md p-4 sm:p-5">
				<div>
					<label className={labelClass}>Bill total</label>
					<div className="flex gap-2">
						<input
							className={fieldClass}
							inputMode="decimal"
							value={total}
							onChange={(e) => setTotal(e.target.value)}
						/>
						<div className="w-28 shrink-0">
							<CurrencySelect value={currency} onChange={setCurrency} />
						</div>
					</div>
				</div>

				<div className="flex gap-2">
					{(
						[
							["amount", "By amount"],
							["percent", "By %"],
						] as const
					).map(([id, label]) => (
						<button
							key={id}
							type="button"
							onClick={() => setMode(id)}
							className={`flex-1 rounded-lg py-2 text-sm font-medium ${
								mode === id
									? "bg-indigo-600 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							{label}
						</button>
					))}
				</div>

				<div className="space-y-2">
					<label className={labelClass}>Each person’s share</label>
					{rows.map((row, i) => (
						<div key={i} className="flex gap-2">
							<input
								className={fieldClass}
								value={row.name}
								onChange={(e) => updateRow(i, { name: e.target.value })}
								placeholder="Name"
							/>
							<input
								className={`${fieldClass} w-28 shrink-0`}
								inputMode="decimal"
								value={row.share}
								onChange={(e) => updateRow(i, { share: e.target.value })}
								placeholder={mode === "amount" ? "0.00" : "%"}
							/>
							{rows.length > 2 && (
								<button
									type="button"
									onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
									className="px-2 text-gray-400 hover:text-red-600 text-sm"
									aria-label="Remove"
								>
									✕
								</button>
							)}
						</div>
					))}
					<button
						type="button"
						onClick={() =>
							setRows((r) => [...r, { name: `Person ${r.length + 1}`, share: "" }])
						}
						className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
					>
						+ Add person
					</button>
				</div>

				<p
					className={`text-xs ${
						balanced ? "text-green-700" : "text-amber-700"
					}`}
				>
					{mode === "amount"
						? `Shares sum to ${currency.symbol}${amountSum.toFixed(2)} (bill ${currency.symbol}${bill.toFixed(2)})`
						: `Percentages sum to ${shareSum.toFixed(1)}%`}
					{!balanced && mode === "amount" && " — adjust to match the bill"}
					{mode === "percent" && shareSum > 0 && shareSum !== 100
						? " — will be normalized"
						: ""}
				</p>

				<div>
					<label className={labelClass}>Who paid the bill?</label>
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
				title="Unequal split"
				people={people}
				expenses={expenses}
				currency={currency}
				tool="split-bill-unequally"
			/>
		</div>
	);
};
