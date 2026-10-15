"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Expense } from "@/types";
import { parseOrderText } from "@/utils/orderBill";
import { OrderSplit } from "@/components/Scan/OrderSplit";
import { ScanOrderButton } from "@/components/Scan/ScanOrderButton";
import { useOrderScan } from "@/components/Scan/useOrderScan";
import { BILL_DRAFT_KEY, draftFromOrder, draftShares, draftTotals, emptyDraft, type DraftOrder } from "@/components/Scan/draft";
import { CalculatorResult, fieldClass, labelClass, makePeople, useDefaultCurrency, useEngaged } from "./shared";

const TOOL = "split-swiggy-zomato-bill";

/** A sample order so the page shows how it works before anyone scans. */
const SAMPLE = draftFromOrder(
	parseOrderText(
		[
			"Behrouz Biryani",
			"Paneer Butter Masala x 1 ₹320",
			"Chicken Dum Biryani x 2 ₹598",
			"Butter Naan x 4 ₹180",
			"Item Total ₹1,098",
			"Delivery Fee ₹39",
			"Platform Fee ₹10",
			"GST and Restaurant Charges ₹82.35",
			"Item Discount -₹150",
			"To Pay ₹1,079.35",
		].join("\n")
	)
);
SAMPLE.items[0].people = ["p1"];
SAMPLE.items[1].people = ["p2", "p3"];

/** Split a Swiggy, Zomato or Instamart order by who had what, from a screenshot. */
export const OrderSplitCalculator = () => {
	const [currency] = useDefaultCurrency("INR");
	const [names, setNames] = useState(["You", "Asha", "Ben"]);
	const [payer, setPayer] = useState(0);
	const [draft, setDraft] = useState<DraftOrder>(SAMPLE);
	const [sample, setSample] = useState(true);
	const { state, scan } = useOrderScan(TOOL);
	const engaged = useEngaged(TOOL);

	const people = useMemo(() => makePeople(names.map((n, i) => n.trim() || `Person ${i + 1}`)), [names]);
	const ids = people.map((p) => p.id);

	const read = async (file: File) => {
		engaged();
		const order = await scan(file);
		if (order) {
			setDraft(draftFromOrder(order));
			setSample(false);
		}
	};

	// Desktop: paste a screenshot straight onto the page.
	useEffect(() => {
		const onPaste = (e: ClipboardEvent) => {
			const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
			if (file) {
				e.preventDefault();
				void read(file);
			}
		};
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	});

	const { total } = draftTotals(draft);
	const shares = draftShares(draft, ids);
	const paidBy = people[Math.min(payer, people.length - 1)]?.id;
	const expenses: Expense[] =
		total > 0 && shares.length && paidBy
			? [
					{
						id: "exp-1",
						amount: total,
						paidBy,
						participants: shares.map((s) => s.personId),
						description: draft.title,
						splitMethod: "exact",
						amounts: Object.fromEntries(shares.map((s) => [s.personId, s.amount])),
					},
				]
			: [];

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
			<div
				className="surface min-w-0 space-y-6 p-4 sm:p-5"
				onDragOver={(e) => e.preventDefault()}
				onDrop={(e) => {
					e.preventDefault();
					const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
					if (file) void read(file);
				}}
			>
				<div>
					<ScanOrderButton state={state} onFile={read} />
					<p className="mt-1 hidden text-xs text-ink-muted sm:block">On a computer you can also paste or drop a screenshot here.</p>
					{sample && state.status !== "reading" && (
						<p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
							Showing a sample order. Scan yours to replace it, or{" "}
							<button
								type="button"
								className="font-semibold underline"
								onClick={() => {
									engaged();
									setDraft(emptyDraft());
									setSample(false);
								}}
							>
								start from scratch
							</button>
							.
						</p>
					)}
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<span className={labelClass}>Who ordered?</span>
						<div className="space-y-2">
							{names.map((name, i) => (
								<div key={i} className="flex items-center gap-2">
									<input
										className={fieldClass}
										value={name}
										onChange={(e) => {
											engaged();
											setNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)));
										}}
										aria-label={`Person ${i + 1}`}
									/>
									{names.length > 2 && (
										<button
											type="button"
											className="icon-btn hover:!text-negative"
											aria-label={`Remove ${name || `person ${i + 1}`}`}
											onClick={() => {
												setNames((prev) => prev.filter((_, j) => j !== i));
												// Ids follow position (p1, p2…): drop this person and shift the ones after.
												const shift = (id: string) => {
													const k = parseInt(id.slice(1), 10);
													return k === i + 1 ? null : k > i + 1 ? `p${k - 1}` : id;
												};
												setDraft((d) => ({
													...d,
													items: d.items.map((it) => ({ ...it, people: it.people.map(shift).filter((p): p is string => p !== null) })),
												}));
											}}
										>
											✕
										</button>
									)}
								</div>
							))}
							<button
								type="button"
								onClick={() => setNames((prev) => [...prev, `Friend ${prev.length}`])}
								className="text-sm font-medium text-brand-700 hover:underline"
							>
								+ Add person
							</button>
						</div>
					</div>
					<div>
						<label className={labelClass} htmlFor="order-payer">
							Who paid?
						</label>
						<select id="order-payer" className={fieldClass} value={Math.min(payer, people.length - 1)} onChange={(e) => setPayer(parseInt(e.target.value, 10))}>
							{people.map((p, i) => (
								<option key={p.id} value={i}>
									{p.name}
								</option>
							))}
						</select>
					</div>
				</div>

				<OrderSplit
					draft={draft}
					onChange={(d) => {
						engaged();
						setDraft(d);
					}}
					people={people}
					currency={currency}
					hideShares
				/>
			</div>

			<div className="min-w-0 lg:sticky lg:top-20">
				<CalculatorResult title={draft.title || "Food order"} people={people} expenses={expenses} currency={currency} tool={TOOL} />
				{/* Hand this bill to "tap what you ate", so friends pick their own items. */}
				<button
					type="button"
					onClick={() => {
						try {
							sessionStorage.setItem(BILL_DRAFT_KEY, JSON.stringify(draft));
						} catch {
							/* storage blocked: they'll scan again there */
						}
						window.location.assign("/split/by-item");
					}}
					className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-left text-sm font-semibold text-brand-900 hover:bg-brand-100"
				>
					Send friends a link to tick what they ate
					<ArrowRight className="h-4 w-4 shrink-0" />
				</button>
			</div>
		</div>
	);
};
