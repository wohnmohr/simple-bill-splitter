"use client";

import { useState } from "react";
import { fieldClass, labelClass, useEngaged, useTrackResult } from "./shared";
import { formatCurrency } from "@/utils/formatting";
import { CURRENCIES } from "@/constants";

const TOOL = "gst-calculator";
const INR = CURRENCIES[0];
const RATES = ["0.25", "3", "5", "12", "18", "28"];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** GST on an amount that either excludes (add) or includes (remove) tax. */
export function computeGst(amount: number, rate: number, mode: "add" | "remove") {
	const base = mode === "add" ? amount : amount / (1 + rate / 100);
	const gst = mode === "add" ? (amount * rate) / 100 : amount - base;
	return { base: round2(base), gst: round2(gst), total: round2(base + gst) };
}

export const GstCalculator = () => {
	const [amount, setAmount] = useState("1000");
	const [rate, setRate] = useState("18");
	const [mode, setMode] = useState<"add" | "remove">("add");
	const [people, setPeople] = useState("1");
	const engaged = useEngaged(TOOL);

	const amt = parseFloat(amount) || 0;
	const pct = Math.max(0, parseFloat(rate) || 0);
	const count = Math.max(1, Math.min(50, parseInt(people, 10) || 1));
	const { base, gst, total } = computeGst(amt, pct, mode);
	useTrackResult(TOOL, amt > 0);

	const fmt = (n: number) => formatCurrency(n, INR);
	const row = (label: string, value: string, strong = false) => (
		<div className={`flex justify-between gap-3 py-2 ${strong ? "font-semibold text-ink" : "text-gray-700"}`}>
			<span>{label}</span>
			<span className="tabular-nums">{value}</span>
		</div>
	);

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<div className="surface space-y-4 p-4 sm:p-5">
				<div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 text-sm font-medium">
					{(["add", "remove"] as const).map((m) => (
						<button
							key={m}
							type="button"
							onClick={() => {
								engaged();
								setMode(m);
							}}
							className={`rounded-lg px-3 py-2 ${mode === m ? "bg-white shadow-sm text-ink" : "text-gray-600"}`}
						>
							{m === "add" ? "Add GST" : "Remove GST"}
						</button>
					))}
				</div>
				<div>
					<label className={labelClass} htmlFor="gst-amount">
						{mode === "add" ? "Amount before GST (₹)" : "Amount including GST (₹)"}
					</label>
					<input
						id="gst-amount"
						className={fieldClass}
						inputMode="decimal"
						value={amount}
						onChange={(e) => {
							engaged();
							setAmount(e.target.value);
						}}
					/>
				</div>
				<div>
					<label className={labelClass} htmlFor="gst-rate">
						GST rate (%)
					</label>
					<input id="gst-rate" className={fieldClass} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
					<div className="mt-2 flex flex-wrap gap-1.5">
						{RATES.map((r) => (
							<button
								key={r}
								type="button"
								onClick={() => setRate(r)}
								className={`rounded-full border px-3 py-1 text-sm ${rate === r ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"}`}
							>
								{r}%
							</button>
						))}
					</div>
				</div>
				<div>
					<label className={labelClass} htmlFor="gst-people">
						Split between (people)
					</label>
					<input id="gst-people" className={fieldClass} inputMode="numeric" value={people} onChange={(e) => setPeople(e.target.value)} />
				</div>
			</div>

			<div className="surface shadow-raised p-4 sm:p-5">
				<p className="label-text">Result</p>
				<div className="divide-y divide-line text-sm">
					{row("Amount before GST", fmt(base))}
					{row(`GST @ ${pct}%`, fmt(gst))}
					{row(`CGST ${pct / 2}%`, fmt(round2(gst / 2)))}
					{row(`SGST ${pct / 2}%`, fmt(round2(gst / 2)))}
					{row("Total including GST", fmt(total), true)}
					{count > 1 && row(`Each of ${count} pays`, fmt(round2(total / count)), true)}
				</div>
			</div>
		</div>
	);
};
