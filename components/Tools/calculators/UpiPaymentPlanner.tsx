"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Info, Minus, Plus } from "lucide-react";
import { CURRENCIES } from "@/constants";
import { formatCurrency } from "@/utils/formatting";
import {
	MAX_FREE_PAYMENT,
	MAX_SPLIT_TOTAL,
	MDR_RULES,
	MerchantType,
	SMALL_MERCHANT_MONTHLY_LIMIT,
	minFreePayments,
	planPayments,
	upiMdr,
} from "@/utils/upiFees";
import { fieldClass, labelClass } from "./shared";
import { track } from "@/lib/analytics";

const INR = CURRENCIES.find((c) => c.code === "INR")!;
const inr = (n: number) => formatCurrency(n, INR);
const num = (n: number) => n.toLocaleString("en-IN");
const PRESETS = [5_000, 10_000, 20_000, 100_000] as const;
const STORAGE_KEY = "splitbiller-upi-plan";

/** Saved per extra payment, in ₹, below which splitting is not worth the effort. */
const WORTH_IT = 5;
const MARGINAL = 1;

const TONE = {
	good: "bg-positive-soft text-positive",
	mid: "bg-brand-50 text-brand-800",
	bad: "bg-negative-soft text-negative",
} as const;

/** Payment amounts, one per payment, in plan order. Bounded by MAX_SPLIT_TOTAL / ₹2,000. */
const expand = (groups: { count: number; amount: number }[]) =>
	groups.flatMap((g) => Array<number>(g.count).fill(g.amount));

/**
 * Plans taking an amount in payments of ₹2,000 or less. Only amounts up to
 * ₹20,000 (at most 10 payments) get a plan; anything larger is explained, not
 * generated — the MDR is capped at ₹300, so hundreds of payments never pay off.
 */
export const UpiPaymentPlanner = () => {
	const [totalStr, setTotalStr] = useState("10000");
	const [type, setType] = useState<MerchantType>("standard");
	const [small, setSmall] = useState(false);
	const [pick, setPick] = useState<number | null>(null);
	const [done, setDone] = useState<number[]>([]);
	const [copied, setCopied] = useState(false);
	const engagedRef = useRef(false);

	const engaged = () => {
		if (engagedRef.current) return;
		engagedRef.current = true;
		track("tool_calculator_engaged", { tool: "upi-payment-split-planner" });
	};

	const total = Math.max(0, Math.round(parseFloat(totalStr) || 0));
	const tooLarge = total > MAX_SPLIT_TOTAL;
	const kmin = minFreePayments(total);
	const k = Math.min(Math.max(pick ?? kmin, 1), Math.max(kmin, 1));

	const single = useMemo(() => planPayments(total, 1, type, small), [total, type, small]);
	const plan = useMemo(() => planPayments(total, k, type, small), [total, k, type, small]);
	const payments = useMemo(() => expand(plan.groups), [plan.groups]);
	const saved = Math.round((single.fee - plan.fee) * 100) / 100;

	// Tick-off progress survives a refresh, but only for the same plan.
	const signature = `${total}:${k}:${type}`;
	useEffect(() => {
		try {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
			setDone(stored?.sig === signature ? stored.done : []);
		} catch {
			setDone([]);
		}
	}, [signature]);

	const toggle = (i: number) => {
		const next = done.includes(i) ? done.filter((d) => d !== i) : [...done, i];
		setDone(next);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ sig: signature, done: next }));
		} catch {
			/* works without storage; progress just isn't remembered */
		}
	};

	const doneAmount = done.reduce((sum, i) => sum + (payments[i] ?? 0), 0);
	const perExtra = kmin > 1 ? single.fee / (kmin - 1) : 0;
	const verdict =
		perExtra >= WORTH_IT
			? { tone: "good", label: "Worth considering" }
			: perExtra >= MARGINAL
			? { tone: "mid", label: "Marginal" }
			: { tone: "bad", label: "Probably not worth it" };

	const planText = [
		`UPI plan for ${inr(total)} — ${plan.payments} payment${plan.payments === 1 ? "" : "s"}:`,
		...payments.map((a, i) => `${i + 1}. ${inr(a)}`),
		`MDR: ${inr(plan.fee)} (one payment: ${inr(single.fee)})`,
	].join("\n");

	const copyPlan = async () => {
		try {
			await navigator.clipboard.writeText(planText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* clipboard unavailable */
		}
	};

	const step = (delta: number) => {
		engaged();
		setPick(Math.min(Math.max(k + delta, 1), kmin));
	};

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
			{/* Inputs */}
			<div className="surface space-y-4 p-4 sm:p-5">
				<div>
					<label className={labelClass} htmlFor="plan-total">
						Amount to collect (₹)
					</label>
					<input
						id="plan-total"
						className={fieldClass}
						inputMode="numeric"
						value={totalStr}
						onChange={(e) => {
							engaged();
							setTotalStr(e.target.value.replace(/[^\d.]/g, ""));
							setPick(null);
						}}
					/>
					<div className="mt-2 flex flex-wrap gap-1.5">
						{PRESETS.map((p) => (
							<button
								key={p}
								type="button"
								onClick={() => {
									engaged();
									setTotalStr(String(p));
									setPick(null);
								}}
								className="rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:border-ink-muted"
							>
								{inr(p)}
							</button>
						))}
					</div>
					<p className="mt-2 text-xs text-ink-muted">
						Plans up to {inr(MAX_SPLIT_TOTAL)} ({MAX_SPLIT_TOTAL / MAX_FREE_PAYMENT} payments).
						Beyond that, splitting stops making sense — you’ll see why.
					</p>
				</div>

				<div>
					<label className={labelClass} htmlFor="plan-type">
						Merchant type
					</label>
					<select
						id="plan-type"
						className={fieldClass}
						value={type}
						onChange={(e) => {
							engaged();
							setType(e.target.value as MerchantType);
							setPick(null);
						}}
					>
						{(Object.keys(MDR_RULES) as MerchantType[]).map((t) => (
							<option key={t} value={t}>
								{MDR_RULES[t].label}
							</option>
						))}
					</select>
				</div>

				<label className="flex items-start gap-2.5 text-sm text-ink-soft">
					<input
						type="checkbox"
						checked={small}
						onChange={(e) => {
							setSmall(e.target.checked);
							setPick(null);
						}}
						className="mt-0.5 h-4 w-4 rounded border-line-strong accent-brand-700"
					/>
					My UPI receipts are {inr(SMALL_MERCHANT_MONTHLY_LIMIT)} a month or less
				</label>

				<p className="flex items-start gap-2 text-xs text-ink-muted">
					<Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>
						Based on the publicly reported NPCI MDR framework (from 15 Oct 2026). Your bank
						or payment provider may flag repeated payments from one payer, and payers have
						daily UPI limits — confirm what is allowed before relying on a split.
					</span>
				</p>
			</div>

			{/* Result */}
			<div className="space-y-4" aria-live="polite">
				{total <= 0 ? (
					<div className="surface p-6 text-center text-sm text-ink-muted">
						Enter an amount to plan the payments.
					</div>
				) : tooLarge ? (
					<div className="surface shadow-raised space-y-3 p-5">
						<p className="label-text">Over the planner’s limit</p>
						<p className="font-display text-2xl font-semibold text-ink">
							{num(kmin)} payments is too many to plan
						</p>
						<p className="text-sm text-ink-soft">
							The planner covers up to {inr(MAX_SPLIT_TOTAL)} ({MAX_SPLIT_TOTAL / MAX_FREE_PAYMENT}{" "}
							payments). Keeping {inr(total)} within {inr(MAX_FREE_PAYMENT)} each would take{" "}
							<span className="font-semibold text-ink">{num(kmin)} payments</span> to save at
							most {inr(single.fee)} — about{" "}
							{inr(Math.round((single.fee / Math.max(kmin - 1, 1)) * 100) / 100)} each. As one
							payment it costs {inr(single.fee)} ({((single.fee / total) * 100).toFixed(2)}% of
							the amount){single.fee >= MDR_RULES.standard.cap! && type === "standard" ? ", because the MDR is capped" : ""}.
						</p>
						<p className="text-sm text-ink-soft">
							For an amount this size, consider one UPI payment, or a bank transfer (NEFT,
							RTGS or IMPS), card or payment link — check the charges with your bank.
						</p>
						<button
							type="button"
							onClick={() => {
								setTotalStr(String(MAX_SPLIT_TOTAL));
								setPick(null);
							}}
							className="btn-secondary w-full sm:w-auto"
						>
							Plan {inr(MAX_SPLIT_TOTAL)} instead
						</button>
					</div>
				) : single.fee === 0 ? (
					<div className="surface shadow-raised space-y-2 p-5">
						<p className="label-text">Result</p>
						<p className="font-display text-3xl font-semibold text-positive">No MDR to avoid</p>
						<p className="text-sm text-ink-soft">
							{small
								? "As a merchant receiving up to ₹1 lakh a month over UPI, you pay no MDR — take it in one payment."
								: `${inr(total)} is within ${inr(MAX_FREE_PAYMENT)}, so no MDR applies.`}
						</p>
					</div>
				) : (
					<>
						<div className="surface shadow-raised space-y-4 p-4 sm:p-5">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="label-text">Your plan</p>
								<span
									className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[verdict.tone as keyof typeof TONE]}`}
								>
									{verdict.label}
								</span>
							</div>

							<dl className="grid grid-cols-3 divide-x divide-line rounded-xl border border-line text-center">
								{[
									["MDR", inr(plan.fee)],
									["One payment", inr(single.fee)],
									["You save", inr(saved)],
								].map(([label, value]) => (
									<div key={label} className="px-2 py-2.5">
										<dt className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</dt>
										<dd className="mt-0.5 text-base font-semibold tabular-nums text-ink">{value}</dd>
									</div>
								))}
							</dl>

							<div className="flex items-center justify-between gap-3">
								<span className="text-sm font-semibold text-ink" id="plan-count-label">
									Number of payments
								</span>
								<div className="flex items-center gap-2" role="group" aria-labelledby="plan-count-label">
									<button
										type="button"
										onClick={() => step(-1)}
										disabled={k <= 1}
										aria-label="Fewer payments"
										className="icon-btn border border-line-strong disabled:opacity-40"
									>
										<Minus className="h-4 w-4" />
									</button>
									<span className="w-8 text-center text-lg font-semibold tabular-nums text-ink">{k}</span>
									<button
										type="button"
										onClick={() => step(1)}
										disabled={k >= kmin}
										aria-label="More payments"
										className="icon-btn border border-line-strong disabled:opacity-40"
									>
										<Plus className="h-4 w-4" />
									</button>
								</div>
							</div>

							<p className="rounded-xl bg-paper px-3 py-2.5 text-sm text-ink-soft">
								{saved > 0 ? (
									<>
										Splitting saves {inr(saved)}.{" "}
									</>
								) : (
									<>Not enough payments yet to avoid the fee. </>
								)}
								All {kmin} payments within {inr(MAX_FREE_PAYMENT)} would save {inr(single.fee)} —{" "}
								<span className="font-semibold text-ink">
									{inr(Math.round(perExtra * 100) / 100)} per extra payment
								</span>
								.
							</p>
						</div>

						<div className="surface space-y-3 p-4 sm:p-5">
							<div className="flex items-baseline justify-between gap-2">
								<p className="label-text">Payments</p>
								<p className="text-sm tabular-nums text-ink-soft">
									{done.length} of {payments.length} received · {inr(doneAmount)}
								</p>
							</div>
							<ul className="divide-y divide-line rounded-xl border border-line text-sm">
								{payments.map((amount, i) => (
									<li key={i}>
										<label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
											<input
												type="checkbox"
												checked={done.includes(i)}
												onChange={() => toggle(i)}
												className="h-4 w-4 rounded border-line-strong accent-brand-700"
											/>
											<span className={`flex-1 ${done.includes(i) ? "text-ink-muted line-through" : "text-ink-soft"}`}>
												Payment {i + 1}
											</span>
											<span className="font-medium tabular-nums text-ink">{inr(amount)}</span>
										</label>
									</li>
								))}
							</ul>
							<button type="button" onClick={copyPlan} className="btn-secondary w-full">
								{copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
								{copied ? "Copied" : "Copy plan"}
							</button>
							<p className="text-xs text-ink-muted">Ticks are saved on this device only.</p>
						</div>
					</>
				)}
			</div>
		</div>
	);
};
