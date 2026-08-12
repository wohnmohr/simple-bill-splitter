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

/** Restaurant: bill + service charge/tip % or fixed + people count */
export const RestaurantCalculator = () => {
	const [currency, setCurrency] = useDefaultCurrency("INR");
	const [bill, setBill] = useState("4850");
	const [chargeType, setChargeType] = useState<"percent" | "fixed">("percent");
	const [chargeValue, setChargeValue] = useState("5");
	const [peopleCount, setPeopleCount] = useState("7");
	const [payerIndex, setPayerIndex] = useState(0);
	const [names, setNames] = useState("");

	const count = Math.max(2, Math.min(20, parseInt(peopleCount, 10) || 2));
	const billAmount = parseFloat(bill) || 0;
	const charge = parseFloat(chargeValue) || 0;
	const service =
		chargeType === "percent" ? (billAmount * charge) / 100 : charge;
	const total = Math.round((billAmount + service) * 100) / 100;

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
	const expenses =
		total > 0
			? [
					makeEqualExpense(
						total,
						people,
						paidBy,
						`Restaurant bill${service > 0 ? " + service/tip" : ""}`
					),
				]
			: [];

	const perPerson = people.length ? total / people.length : 0;

	return (
		<div className="grid lg:grid-cols-2 gap-6">
			<div className="space-y-4 rounded-2xl bg-white/80 border border-white/60 shadow-md p-4 sm:p-5">
				<div>
					<label className={labelClass}>Bill amount</label>
					<div className="flex gap-2">
						<input
							className={fieldClass}
							inputMode="decimal"
							value={bill}
							onChange={(e) => setBill(e.target.value)}
							placeholder="4850"
						/>
						<div className="w-28 shrink-0">
							<CurrencySelect value={currency} onChange={setCurrency} />
						</div>
					</div>
				</div>

				<div>
					<label className={labelClass}>Service charge / tip</label>
					<div className="flex gap-2 mb-2">
						{(
							[
								["percent", "Percent"],
								["fixed", "Fixed"],
							] as const
						).map(([id, label]) => (
							<button
								key={id}
								type="button"
								onClick={() => setChargeType(id)}
								className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
									chargeType === id
										? "bg-indigo-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								{label}
							</button>
						))}
					</div>
					<input
						className={fieldClass}
						inputMode="decimal"
						value={chargeValue}
						onChange={(e) => setChargeValue(e.target.value)}
						placeholder={chargeType === "percent" ? "5" : "200"}
					/>
					{chargeType === "percent" && (
						<div className="flex flex-wrap gap-1.5 mt-2">
							{["5", "10", "12", "15", "18", "20"].map((p) => (
								<button
									key={p}
									type="button"
									onClick={() => setChargeValue(p)}
									className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
								>
									{p}%
								</button>
							))}
						</div>
					)}
				</div>

				<div>
					<label className={labelClass}>Number of people</label>
					<input
						className={fieldClass}
						inputMode="numeric"
						value={peopleCount}
						onChange={(e) => setPeopleCount(e.target.value)}
					/>
				</div>

				<div>
					<label className={labelClass}>
						Names (optional, comma-separated)
					</label>
					<input
						className={fieldClass}
						value={names}
						onChange={(e) => setNames(e.target.value)}
						placeholder="Asha, Rohan, Mia, …"
					/>
				</div>

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

				<div className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
					Grand total{" "}
					<strong>
						{currency.symbol}
						{total.toFixed(2)}
					</strong>
					{" · "}
					~{currency.symbol}
					{perPerson.toFixed(2)} each
				</div>
			</div>

			<CalculatorResult
				title="Restaurant split"
				people={people}
				expenses={expenses}
				currency={currency}
				tool="restaurant-bill-splitter"
			/>
		</div>
	);
};
