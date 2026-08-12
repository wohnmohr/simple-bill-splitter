"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { calculateSettlements } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatting";
import { CURRENCIES } from "@/constants";
import {
	CalculatorResult,
	fieldClass,
	labelClass,
	makeEqualExpense,
	makePeople,
} from "./shared";
import { track } from "@/lib/analytics";

const INR = CURRENCIES.find((c) => c.code === "INR")!;

function buildUpiLink(opts: {
	pa: string;
	pn: string;
	am: number;
	tn: string;
}): string {
	const params = new URLSearchParams({
		pa: opts.pa.trim(),
		pn: opts.pn.trim(),
		am: opts.am.toFixed(2),
		cu: "INR",
		tn: opts.tn.slice(0, 50),
	});
	return `upi://pay?${params.toString()}`;
}

/** INR-focused splitter with optional UPI payment intents */
export const UpiCalculator = () => {
	const [bill, setBill] = useState("4850");
	const [names, setNames] = useState("Asha, Rohan, Meera, Kabir");
	const [payerIndex, setPayerIndex] = useState(0);
	const [note, setNote] = useState("Dinner split");
	const [upis, setUpis] = useState<Record<string, string>>({});

	const people = useMemo(
		() => makePeople(names.split(",").map((n) => n.trim())),
		[names]
	);

	const total = parseFloat(bill) || 0;
	const paidBy = people[Math.min(payerIndex, people.length - 1)]?.id;
	const expenses =
		total > 0 && people.length >= 2 && paidBy
			? [makeEqualExpense(total, people, paidBy, note || "UPI split")]
			: [];

	const settlements = calculateSettlements(people, expenses);

	const upiExtra =
		settlements.length > 0 ? (
			<div className="space-y-3 border-t border-indigo-50 pt-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
					Pay via UPI
				</p>
				<p className="text-xs text-gray-500">
					Add the receiver&apos;s UPI ID, then open your UPI app with the exact
					amount. We never process payments.
				</p>
				{settlements.map((s, i) => {
					const to = people.find((p) => p.id === s.to);
					const from = people.find((p) => p.id === s.from);
					if (!to || !from) return null;
					const vpa = upis[to.id] || "";
					const link =
						vpa.trim().length > 3
							? buildUpiLink({
									pa: vpa,
									pn: to.name,
									am: s.amount,
									tn: `${note || "Split"} — ${from.name}`,
								})
							: null;

					return (
						<div
							key={i}
							className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2"
						>
							<p className="text-sm font-medium text-gray-800">
								{from.name} → {to.name}: {formatCurrency(s.amount, INR)}
							</p>
							<input
								className={fieldClass}
								value={vpa}
								onChange={(e) =>
									setUpis((prev) => ({ ...prev, [to.id]: e.target.value }))
								}
								placeholder={`${to.name}'s UPI ID (name@upi)`}
							/>
							{link ? (
								<a
									href={link}
									onClick={() => track("upi_pay_link_clicked")}
									className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
								>
									Pay {formatCurrency(s.amount, INR)} via UPI
									<ExternalLink className="h-3.5 w-3.5" />
								</a>
							) : (
								<p className="text-xs text-gray-400">
									Enter UPI ID to enable pay link
								</p>
							)}
						</div>
					);
				})}
			</div>
		) : null;

	return (
		<div className="grid lg:grid-cols-2 gap-6">
			<div className="space-y-4 rounded-2xl bg-white/80 border border-white/60 shadow-md p-4 sm:p-5">
				<div>
					<label className={labelClass}>Bill amount (₹)</label>
					<input
						className={fieldClass}
						inputMode="decimal"
						value={bill}
						onChange={(e) => setBill(e.target.value)}
					/>
				</div>
				<div>
					<label className={labelClass}>Note</label>
					<input
						className={fieldClass}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Dinner / cab / rent"
					/>
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
					>
						{people.map((p, i) => (
							<option key={p.id} value={i}>
								{p.name}
							</option>
						))}
					</select>
				</div>
				<p className="text-xs text-gray-500">
					Opens GPay, PhonePe, Paytm, or any UPI app via standard{" "}
					<code className="text-indigo-700">upi://</code> links.
				</p>
			</div>

			<CalculatorResult
				title={note || "UPI split"}
				people={people}
				expenses={expenses}
				currency={INR}
				extra={upiExtra}
				ctaLabel="Open SplitBiller (₹)"
				tool="upi-bill-splitter"
			/>
		</div>
	);
};
