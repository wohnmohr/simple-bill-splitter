"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Person } from "@/types";
import { calculateSettlements } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatting";
import { CURRENCIES } from "@/constants";
import { buildUpiLink } from "@/utils/upi";
import {
	CalculatorResult,
	fieldClass,
	labelClass,
	makeEqualExpense,
} from "./shared";
import { track } from "@/lib/analytics";

const INR = CURRENCIES.find((c) => c.code === "INR")!;

type PersonRow = { name: string; upiId: string };

/** INR-focused splitter with UPI IDs that travel in encrypted share links */
export const UpiCalculator = () => {
	const [bill, setBill] = useState("4850");
	const [rows, setRows] = useState<PersonRow[]>([
		{ name: "Asha", upiId: "" },
		{ name: "Rohan", upiId: "" },
		{ name: "Meera", upiId: "" },
		{ name: "Kabir", upiId: "" },
	]);
	const [payerIndex, setPayerIndex] = useState(0);
	const [note, setNote] = useState("Dinner split");

	const people: Person[] = useMemo(
		() =>
			rows
				.map((r, i) => ({ ...r, rowIndex: i }))
				.filter((r) => r.name.trim())
				.map((r) => ({
					id: `p${r.rowIndex + 1}`,
					name: r.name.trim(),
					...(r.upiId.trim() ? { upiId: r.upiId.trim() } : {}),
				})),
		[rows]
	);

	const total = parseFloat(bill) || 0;
	const paidBy = people[Math.min(payerIndex, people.length - 1)]?.id;
	const expenses =
		total > 0 && people.length >= 2 && paidBy
			? [makeEqualExpense(total, people, paidBy, note || "UPI split")]
			: [];

	const settlements = calculateSettlements(people, expenses);

	const updateRow = (index: number, patch: Partial<PersonRow>) => {
		setRows((prev) =>
			prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
		);
	};

	const upiExtra =
		settlements.length > 0 ? (
			<div className="space-y-3 border-t border-indigo-50 pt-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
					Pay via UPI
				</p>
				<p className="text-xs text-gray-500">
					UPI IDs you enter below are included when you share the settlement —
					friends can tap Pay without retyping.
				</p>
				{settlements.map((s, i) => {
					const to = people.find((p) => p.id === s.to);
					const from = people.find((p) => p.id === s.from);
					if (!to || !from) return null;
					const link = to.upiId
						? buildUpiLink({
								pa: to.upiId,
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
							{to.upiId ? (
								<p className="text-xs text-gray-500">UPI: {to.upiId}</p>
							) : (
								<p className="text-xs text-amber-700">
									Add {to.name}&apos;s UPI ID on the left so others can pay
									from the share link.
								</p>
							)}
							{link ? (
								<a
									href={link}
									onClick={() => track("upi_pay_link_clicked")}
									className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
								>
									Pay {formatCurrency(s.amount, INR)} via UPI
									<ExternalLink className="h-3.5 w-3.5" />
								</a>
							) : null}
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

				<div className="space-y-3">
					<label className={labelClass}>People &amp; UPI IDs</label>
					{rows.map((row, i) => (
						<div
							key={i}
							className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-2"
						>
							<div className="flex gap-2">
								<input
									className={fieldClass}
									value={row.name}
									onChange={(e) => updateRow(i, { name: e.target.value })}
									placeholder="Name"
								/>
								{rows.length > 2 && (
									<button
										type="button"
										onClick={() =>
											setRows((prev) => prev.filter((_, j) => j !== i))
										}
										className="px-2 text-gray-400 hover:text-red-600 text-sm"
										aria-label="Remove"
									>
										✕
									</button>
								)}
							</div>
							<input
								className={fieldClass}
								value={row.upiId}
								onChange={(e) => updateRow(i, { upiId: e.target.value })}
								placeholder="UPI ID (name@upi) — optional"
								autoComplete="off"
								data-ph-mask
							/>
						</div>
					))}
					<button
						type="button"
						onClick={() =>
							setRows((prev) => [...prev, { name: "", upiId: "" }])
						}
						className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
					>
						+ Add person
					</button>
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
								{p.upiId ? ` (${p.upiId})` : ""}
							</option>
						))}
					</select>
				</div>
				<p className="text-xs text-gray-500">
					Shared links include UPI IDs encrypted in the URL — we never store
					them on a server. Opens GPay, PhonePe, Paytm via{" "}
					<code className="text-indigo-700">upi://</code>.
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
