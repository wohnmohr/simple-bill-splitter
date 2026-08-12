"use client";

import { useEffect, useRef, useState } from "react";
import { Currency, Expense, Person } from "@/types";
import { CURRENCIES } from "@/constants";
import { calculateSettlements } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatting";
import { ShareSettlementActions } from "@/components/Share/ShareSettlementActions";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics";

export function makePeople(names: string[]): Person[] {
	return names
		.map((n) => n.trim())
		.filter(Boolean)
		.map((name, i) => ({ id: `p${i + 1}`, name }));
}

export function makeEqualExpense(
	amount: number,
	people: Person[],
	paidBy: string,
	description: string
): Expense {
	return {
		id: "exp-1",
		amount,
		paidBy,
		participants: people.map((p) => p.id),
		description,
		splitMethod: "equally",
	};
}

type ResultPanelProps = {
	title: string;
	people: Person[];
	expenses: Expense[];
	currency: Currency;
	ctaHref?: string;
	ctaLabel?: string;
	extra?: ReactNode;
	tool?: string;
};

export const CalculatorResult = ({
	title,
	people,
	expenses,
	currency,
	ctaHref = "/dashboard",
	ctaLabel = "Continue in SplitBiller",
	extra,
	tool = "calculator",
}: ResultPanelProps) => {
	const trackedKey = useRef<string | null>(null);

	useEffect(() => {
		if (people.length < 2 || expenses.length === 0) return;
		const key = `${tool}:${people.length}:${expenses.length}:${currency.code}`;
		if (trackedKey.current === key) return;
		trackedKey.current = key;
		track("calculator_result_viewed", {
			tool,
			member_count: people.length,
			expense_count: expenses.length,
			currency: currency.code,
			settlement_count: calculateSettlements(people, expenses).length,
		});
	}, [people, expenses, currency.code, tool]);

	if (people.length < 2 || expenses.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-6 text-center text-sm text-gray-500">
				Fill in the calculator to see who owes whom.
			</div>
		);
	}

	const settlements = calculateSettlements(people, expenses);
	const total = expenses.reduce((s, e) => s + e.amount, 0);

	return (
		<div className="rounded-2xl border border-indigo-100 bg-white/90 shadow-lg p-4 sm:p-5 space-y-4 animate-[fade-in-up_0.4s_ease-out]">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
						Result
					</p>
					<h3 className="text-lg font-bold text-gray-900">{title}</h3>
					<p className="text-sm text-gray-500">
						Total {formatCurrency(total, currency)} · {people.length} people
					</p>
				</div>
			</div>

			{settlements.length === 0 ? (
				<div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-3 py-2 text-sm">
					<Check className="h-4 w-4" />
					Everyone is settled up
				</div>
			) : (
				<ul className="space-y-2">
					{settlements.map((s, i) => {
						const from = people.find((p) => p.id === s.from)?.name;
						const to = people.find((p) => p.id === s.to)?.name;
						return (
							<li
								key={i}
								className="flex items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-2.5"
							>
								<span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 min-w-0">
									<span className="truncate">{from}</span>
									<ArrowRight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
									<span className="truncate">{to}</span>
								</span>
								<span className="font-bold text-indigo-700 shrink-0">
									{formatCurrency(s.amount, currency)}
								</span>
							</li>
						);
					})}
				</ul>
			)}

			{extra}

			<ShareSettlementActions
				name={title}
				people={people}
				expenses={expenses}
				currency={currency}
				primary
				source={`tool:${tool}`}
			/>

			<Link
				href={ctaHref}
				onClick={() =>
					track("calculator_continue_clicked", { tool, destination: ctaHref })
				}
				className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
			>
				{ctaLabel} →
			</Link>
		</div>
	);
};

export const fieldClass =
	"w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export function CurrencySelect({
	value,
	onChange,
	allowed,
}: {
	value: Currency;
	onChange: (c: Currency) => void;
	allowed?: string[];
}) {
	const list = allowed
		? CURRENCIES.filter((c) => allowed.includes(c.code))
		: CURRENCIES;
	return (
		<select
			className={fieldClass}
			value={value.code}
			onChange={(e) => {
				const next = CURRENCIES.find((c) => c.code === e.target.value);
				if (next) onChange(next);
			}}
		>
			{list.map((c) => (
				<option key={c.code} value={c.code}>
					{c.symbol} {c.code}
				</option>
			))}
		</select>
	);
}

export function useDefaultCurrency(code = "INR"): [Currency, (c: Currency) => void] {
	const initial = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
	return useState<Currency>(initial);
}
