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

type Line = {
	description: string;
	amount: string;
	paidByIndex: number;
};

/** Multi-expense trip / roommate style calculator */
export const MultiExpenseCalculator = ({
	variant,
}: {
	variant: "trip" | "roommate";
}) => {
	const [currency, setCurrency] = useDefaultCurrency("INR");
	const [memberNames, setMemberNames] = useState(
		variant === "roommate"
			? "Priya, Dev, Casey"
			: "Nina, Omar, Lee, Sam"
	);
	const [lines, setLines] = useState<Line[]>(
		variant === "roommate"
			? [
					{ description: "Rent", amount: "2400", paidByIndex: 0 },
					{ description: "Internet", amount: "60", paidByIndex: 1 },
					{ description: "Groceries", amount: "185", paidByIndex: 2 },
				]
			: [
					{ description: "Airbnb", amount: "640", paidByIndex: 0 },
					{ description: "Rental car", amount: "210", paidByIndex: 1 },
					{ description: "Group dinner", amount: "156", paidByIndex: 2 },
					{ description: "Museum tickets", amount: "80", paidByIndex: 0 },
				]
	);

	const people = useMemo(
		() =>
			makePeople(
				memberNames.split(",").map((n) => n.trim()).filter(Boolean)
			),
		[memberNames]
	);

	const expenses: Expense[] = useMemo(() => {
		if (people.length < 2) return [];
		return lines
			.filter((l) => (parseFloat(l.amount) || 0) > 0)
			.map((l, i) => {
				const payer = people[Math.min(l.paidByIndex, people.length - 1)];
				return {
					id: `exp-${i}`,
					amount: parseFloat(l.amount) || 0,
					paidBy: payer.id,
					participants: people.map((p) => p.id),
					description: l.description || `Expense ${i + 1}`,
					splitMethod: "equally" as const,
				};
			});
	}, [lines, people]);

	const updateLine = (index: number, patch: Partial<Line>) => {
		setLines((prev) =>
			prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
		);
	};

	const title = variant === "trip" ? "Trip settlement" : "Roommate settlement";

	return (
		<div className="grid lg:grid-cols-2 gap-6">
			<div className="space-y-4 rounded-2xl bg-white/80 border border-white/60 shadow-md p-4 sm:p-5">
				<div>
					<label className={labelClass}>
						{variant === "trip" ? "Travelers" : "Roommates"} (comma-separated)
					</label>
					<input
						className={fieldClass}
						value={memberNames}
						onChange={(e) => setMemberNames(e.target.value)}
					/>
				</div>

				<div>
					<label className={labelClass}>Currency</label>
					<CurrencySelect value={currency} onChange={setCurrency} />
				</div>

				<div className="space-y-3">
					<label className={labelClass}>
						{variant === "trip" ? "Trip expenses" : "This month’s bills"}
					</label>
					{lines.map((line, i) => (
						<div
							key={i}
							className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-2"
						>
							<div className="flex gap-2">
								<input
									className={fieldClass}
									value={line.description}
									onChange={(e) =>
										updateLine(i, { description: e.target.value })
									}
									placeholder="Description"
								/>
								{lines.length > 1 && (
									<button
										type="button"
										onClick={() =>
											setLines((prev) => prev.filter((_, j) => j !== i))
										}
										className="text-gray-400 hover:text-red-600 px-1"
									>
										✕
									</button>
								)}
							</div>
							<div className="flex gap-2">
								<input
									className={fieldClass}
									inputMode="decimal"
									value={line.amount}
									onChange={(e) => updateLine(i, { amount: e.target.value })}
									placeholder="Amount"
								/>
								<select
									className={fieldClass}
									value={Math.min(line.paidByIndex, Math.max(people.length - 1, 0))}
									onChange={(e) =>
										updateLine(i, {
											paidByIndex: parseInt(e.target.value, 10),
										})
									}
								>
									{people.length === 0 ? (
										<option value={0}>Add people first</option>
									) : (
										people.map((p, idx) => (
											<option key={p.id} value={idx}>
												Paid by {p.name}
											</option>
										))
									)}
								</select>
							</div>
						</div>
					))}
					<button
						type="button"
						onClick={() =>
							setLines((prev) => [
								...prev,
								{ description: "", amount: "", paidByIndex: 0 },
							])
						}
						className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
					>
						+ Add expense
					</button>
				</div>
			</div>

			<CalculatorResult
				title={title}
				people={people}
				expenses={expenses}
				currency={currency}
				tool={
					variant === "trip" ? "trip-expense-splitter" : "roommate-expense-splitter"
				}
				ctaLabel={
					variant === "trip"
						? "Track the whole trip in SplitBiller"
						: "Manage monthly splits in SplitBiller"
				}
			/>
		</div>
	);
};
