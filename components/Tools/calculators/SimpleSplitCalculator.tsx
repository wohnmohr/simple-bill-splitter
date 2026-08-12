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

/** Simple equal split — used by no-signup & splitwise alternative pages */
export const SimpleSplitCalculator = ({
	emphasis,
}: {
	emphasis: "privacy" | "alternative";
}) => {
	const [currency, setCurrency] = useDefaultCurrency("INR");
	const [amount, setAmount] = useState("128.50");
	const [names, setNames] = useState("You, Friend A, Friend B");
	const [payerIndex, setPayerIndex] = useState(0);
	const [description, setDescription] = useState(
		emphasis === "privacy" ? "Lunch split" : "Group expense"
	);

	const people = useMemo(
		() => makePeople(names.split(",").map((n) => n.trim())),
		[names]
	);

	const total = parseFloat(amount) || 0;
	const paidBy = people[Math.min(payerIndex, people.length - 1)]?.id;
	const expenses =
		total > 0 && people.length >= 2 && paidBy
			? [makeEqualExpense(total, people, paidBy, description || "Expense")]
			: [];

	return (
		<div className="grid lg:grid-cols-2 gap-6">
			<div className="space-y-4 rounded-2xl bg-white/80 border border-white/60 shadow-md p-4 sm:p-5">
				{emphasis === "privacy" && (
					<p className="text-sm text-indigo-800 bg-indigo-50 rounded-xl px-3 py-2">
						No email wall. Calculate below — share stays encrypted in the link.
					</p>
				)}
				{emphasis === "alternative" && (
					<p className="text-sm text-indigo-800 bg-indigo-50 rounded-xl px-3 py-2">
						Same “who owes whom” outcome as Splitwise — without inviting everyone
						to an account.
					</p>
				)}

				<div>
					<label className={labelClass}>What for?</label>
					<input
						className={fieldClass}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>

				<div>
					<label className={labelClass}>Amount</label>
					<div className="flex gap-2">
						<input
							className={fieldClass}
							inputMode="decimal"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
						<div className="w-28 shrink-0">
							<CurrencySelect value={currency} onChange={setCurrency} />
						</div>
					</div>
				</div>

				<div>
					<label className={labelClass}>People (comma-separated)</label>
					<input
						className={fieldClass}
						value={names}
						onChange={(e) => setNames(e.target.value)}
					/>
				</div>

				<div>
					<label className={labelClass}>Who paid?</label>
					<select
						className={fieldClass}
						value={Math.min(payerIndex, Math.max(people.length - 1, 0))}
						onChange={(e) => setPayerIndex(parseInt(e.target.value, 10))}
						disabled={people.length === 0}
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
				title={description || "Split"}
				people={people}
				expenses={expenses}
				currency={currency}
				tool={
					emphasis === "privacy"
						? "split-bill-without-signup"
						: "splitwise-alternative"
				}
				ctaLabel={
					emphasis === "privacy"
						? "Start without signup"
						: "Try SplitBiller free"
				}
			/>
		</div>
	);
};
