"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, Info } from "lucide-react";
import { CURRENCIES } from "@/constants";
import { formatCurrency } from "@/utils/formatting";
import {
	MAX_FREE_PAYMENT,
	MDR_RULES,
	MerchantType,
	PaymentGroup,
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

/** Keeps the page, the slider and the CSV bounded. */
const MAX_TOTAL = 10_000_000; // ₹1 crore
const PRESETS = [10_000, 50_000, 100_000, 500_000, 1_000_000] as const;
const PREVIEW_ROWS = 5;
const EXPANDED_ROWS = 50;
const STORAGE_KEY = "splitbiller-upi-plan";

/** Saved per extra payment, in ₹, below which splitting is not worth the effort. */
const WORTH_IT = 5;
const MARGINAL = 1;

const inWords = (n: number) => {
	if (n >= 10_000_000) return `${+(n / 10_000_000).toFixed(2)} crore`;
	if (n >= 100_000) return `${+(n / 100_000).toFixed(2)} lakh`;
	if (n >= 1_000) return `${+(n / 1_000).toFixed(1)} thousand`;
	return "";
};

/** First `limit` payments of a plan, without ever building all of them. */
const expandGroups = (groups: PaymentGroup[], limit: number): number[] => {
	const rows: number[] = [];
	for (const g of groups) {
		for (let i = 0; i < g.count && rows.length < limit; i++) rows.push(g.amount);
		if (rows.length >= limit) break;
	}
	return rows;
};

const describeGroups = (groups: PaymentGroup[]) =>
	groups.map((g) => `${num(g.count)} × ${inr(g.amount)}`).join("  +  ");

/** Fee as the number of payments grows — shows at a glance where splitting starts to pay. */
const FeeChart = ({
	points,
	current,
	max,
	feeMax,
}: {
	points: { k: number; fee: number }[];
	current: number;
	max: number;
	feeMax: number;
}) => {
	const W = 300;
	const H = 72;
	const x = (k: number) => (max <= 1 ? 0 : ((k - 1) / (max - 1)) * W);
	const y = (fee: number) => 6 + (feeMax ? (1 - fee / feeMax) * (H - 12) : H - 12);
	return (
		<svg
			viewBox={`0 0 ${W} ${H}`}
			className="h-20 w-full"
			role="img"
			aria-label={`Fee falls from ${inr(feeMax)} with one payment to ${inr(0)} with ${num(max)} payments`}
		>
			<line x1="0" x2={W} y1={H - 6} y2={H - 6} className="stroke-line-strong" strokeWidth="1" />
			<polyline
				fill="none"
				className="stroke-brand-700"
				strokeWidth="2"
				strokeLinejoin="round"
				points={points.map((p) => `${x(p.k)},${y(p.fee)}`).join(" ")}
			/>
			<line x1={x(current)} x2={x(current)} y1="0" y2={H} className="stroke-ink" strokeWidth="1" strokeDasharray="3 3" />
			<circle
				cx={x(current)}
				cy={y(points.reduce((best, p) => (Math.abs(p.k - current) < Math.abs(best.k - current) ? p : best)).fee)}
				r="4"
				className="fill-ink"
			/>
		</svg>
	);
};

/**
 * Plans taking a large UPI amount in payments of ₹2,000 or less. The plan is
 * always shown as a handful of groups — never one row per payment — so ₹10 lakh
 * stays as readable as ₹10,000.
 */
export const UpiPaymentPlanner = () => {
	const [totalStr, setTotalStr] = useState("1000000");
	const [type, setType] = useState<MerchantType>("standard");
	const [small, setSmall] = useState(false);
	const [dailyLimit, setDailyLimit] = useState("100000");
	const [pick, setPick] = useState<number | null>(null);
	const [received, setReceived] = useState(0);
	const [showRows, setShowRows] = useState(false);
	const [copied, setCopied] = useState(false);
	const engagedRef = useRef(false);

	const engaged = () => {
		if (engagedRef.current) return;
		engagedRef.current = true;
		track("tool_calculator_engaged", { tool: "upi-payment-split-planner" });
	};

	const total = Math.min(MAX_TOTAL, Math.max(0, Math.round(parseFloat(totalStr) || 0)));
	const kmin = minFreePayments(total);
	const k = Math.min(Math.max(pick ?? kmin, 1), Math.max(kmin, 1));

	const single = useMemo(() => planPayments(total, 1, type, small), [total, type, small]);
	const plan = useMemo(() => planPayments(total, k, type, small), [total, k, type, small]);
	const saved = Math.round((single.fee - plan.fee) * 100) / 100;

	const chartPoints = useMemo(() => {
		if (kmin <= 1) return [];
		const steps = Math.min(60, kmin);
		return Array.from({ length: steps }, (_, i) => {
			const kk = 1 + Math.round((i * (kmin - 1)) / Math.max(steps - 1, 1));
			return { k: kk, fee: planPayments(total, kk, type, small).fee };
		});
	}, [total, kmin, type, small]);

	useEffect(() => setShowRows(false), [total, k, type, small]);

	// Resume where the merchant left off if this is the same plan.
	const signature = `${total}:${k}:${type}`;
	useEffect(() => {
		try {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
			setReceived(stored?.sig === signature ? Math.min(stored.received, k) : 0);
		} catch {
			setReceived(0);
		}
	}, [signature, k]);

	const updateReceived = (next: number) => {
		const value = Math.max(0, Math.min(k, next));
		setReceived(value);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ sig: signature, received: value }));
		} catch {
			/* works without storage; progress just isn't remembered */
		}
	};

	const receivedAmount = useMemo(() => {
		let left = received;
		let sum = 0;
		for (const g of plan.groups) {
			const take = Math.min(left, g.count);
			sum += take * g.amount;
			left -= take;
		}
		return sum;
	}, [plan.groups, received]);

	const limit = Math.max(MAX_FREE_PAYMENT, parseFloat(dailyLimit) || 0);
	const days = total > 0 ? Math.ceil(total / limit) : 0;
	const largest = plan.groups.reduce((m, g) => Math.max(m, g.amount), 0);
	const perDay = largest > 0 ? Math.floor(limit / largest) : 0;

	const perExtra = kmin > 1 ? single.fee / (kmin - 1) : 0;
	const verdict =
		single.fee === 0
			? null
			: perExtra >= WORTH_IT
			? { tone: "good", label: "Worth considering" }
			: perExtra >= MARGINAL
			? { tone: "mid", label: "Marginal" }
			: { tone: "bad", label: "Probably not worth it" };

	const rows = expandGroups(plan.groups, showRows ? EXPANDED_ROWS : PREVIEW_ROWS);
	const planText = [
		`UPI plan for ${inr(total)}`,
		`${num(plan.payments)} payments: ${describeGroups(plan.groups)}`,
		`MDR: ${inr(plan.fee)} (one payment: ${inr(single.fee)})`,
		days > 1 ? `About ${days} days at ${inr(limit)}/day` : "",
	]
		.filter(Boolean)
		.join("\n");

	const copyPlan = async () => {
		try {
			await navigator.clipboard.writeText(planText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* clipboard unavailable */
		}
	};

	const downloadCsv = () => {
		const lines = ["payment,amount"];
		let n = 1;
		for (const g of plan.groups) for (let i = 0; i < g.count; i++) lines.push(`${n++},${g.amount}`);
		const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
		const a = document.createElement("a");
		a.href = url;
		a.download = `upi-plan-${total}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const tone = {
		good: "bg-positive-soft text-positive",
		mid: "bg-brand-50 text-brand-800",
		bad: "bg-negative-soft text-negative",
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
					<p className="mt-1 h-4 text-xs text-ink-muted">
						{total > 0 ? `${inr(total)}${inWords(total) ? ` · ${inWords(total)}` : ""}` : ""}
						{parseFloat(totalStr) > MAX_TOTAL && ` · capped at ${inr(MAX_TOTAL)}`}
					</p>
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

				<div>
					<label className={labelClass} htmlFor="plan-daily">
						Payer’s daily UPI limit (₹)
					</label>
					<input
						id="plan-daily"
						className={fieldClass}
						inputMode="numeric"
						value={dailyLimit}
						onChange={(e) => setDailyLimit(e.target.value.replace(/[^\d]/g, ""))}
					/>
					<p className="mt-1 text-xs text-ink-muted">
						Banks cap how much one person can send per day — often around ₹1 lakh.
					</p>
				</div>

				<p className="flex items-start gap-2 text-xs text-ink-muted">
					<Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>
						Based on the publicly reported NPCI MDR framework (from 15 Oct 2026). Your bank
						or payment provider may flag repeated payments from one payer — confirm what is
						allowed before relying on a split.
					</span>
				</p>
			</div>

			{/* Result */}
			<div className="space-y-4" aria-live="polite">
				{total <= 0 ? (
					<div className="surface p-6 text-center text-sm text-ink-muted">
						Enter an amount to plan the payments.
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
								{verdict && (
									<span
										className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone[verdict.tone as keyof typeof tone]}`}
									>
										{verdict.label}
									</span>
								)}
							</div>

							<div>
								<p className="font-display text-3xl font-semibold text-ink">
									{num(plan.payments)} payment{plan.payments === 1 ? "" : "s"}
								</p>
								<p className="mt-1 text-sm tabular-nums text-ink-soft">
									{describeGroups(plan.groups)}
								</p>
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

							{kmin > 1 && (
								<div>
									<div className="flex items-baseline justify-between gap-2">
										<label className="text-sm font-semibold text-ink" htmlFor="plan-slider">
											Number of payments
										</label>
										<input
											aria-label="Number of payments"
											className="w-24 rounded-lg border border-line-strong bg-white px-2 py-1 text-right text-sm tabular-nums"
											inputMode="numeric"
											value={k}
											onChange={(e) => {
												engaged();
												const v = parseInt(e.target.value.replace(/\D/g, ""), 10);
												setPick(Number.isFinite(v) ? v : 1);
											}}
										/>
									</div>
									<input
										id="plan-slider"
										type="range"
										min={1}
										max={kmin}
										value={k}
										onChange={(e) => {
											engaged();
											setPick(parseInt(e.target.value, 10));
										}}
										className="mt-2 w-full accent-brand-700"
									/>
									<FeeChart points={chartPoints} current={k} max={kmin} feeMax={single.fee} />
									<div className="mt-1 flex flex-wrap gap-1.5">
										{[
											["One payment", 1],
											["Halfway", Math.max(1, Math.round(kmin / 2))],
											[`All ≤ ${inr(MAX_FREE_PAYMENT)}`, kmin],
										].map(([label, value]) => (
											<button
												key={label as string}
												type="button"
												onClick={() => setPick(value as number)}
												className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
													k === value
														? "border-brand-700 bg-brand-50 text-brand-800"
														: "border-line-strong bg-white text-ink-soft hover:border-ink-muted"
												}`}
											>
												{label}
											</button>
										))}
									</div>
								</div>
							)}

							<p className="rounded-xl bg-paper px-3 py-2.5 text-sm text-ink-soft">
								{kmin > 1 && (
									<>
										Taking it all in {num(kmin)} payments saves {inr(single.fee)} —{" "}
										<span className="font-semibold text-ink">
											{inr(Math.round(perExtra * 100) / 100)} per extra payment
										</span>
										.{" "}
									</>
								)}
								{type === "standard" &&
									"One payment never costs more than ₹300, and splitting only starts saving once the single remaining payment is under ₹75,000."}
							</p>
						</div>

						{/* Logistics */}
						<div className="surface space-y-3 p-4 sm:p-5">
							<p className="label-text">Logistics</p>
							<p className="text-sm text-ink-soft">
								{days > 1 ? (
									<>
										At {inr(limit)} a day the payer needs about{" "}
										<span className="font-semibold text-ink">{num(days)} days</span>
										{perDay > 0 && <> (up to {num(perDay)} payments a day)</>}.
									</>
								) : (
									<>The payer can send this within one day at {inr(limit)} a day.</>
								)}
							</p>

							<ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line text-sm">
								{rows.map((amount, i) => (
									<li key={i} className="flex justify-between px-3 py-2 tabular-nums">
										<span className="text-ink-muted">Payment {i + 1}</span>
										<span className="font-medium text-ink">{inr(amount)}</span>
									</li>
								))}
								{showRows && plan.payments > rows.length && (
									<li className="px-3 py-2 text-center text-xs text-ink-muted">
										Showing the first {EXPANDED_ROWS} — download the CSV for all {num(plan.payments)}.
									</li>
								)}
								{plan.payments > PREVIEW_ROWS && (
									<li className="sticky bottom-0 bg-white px-3 py-2 text-center text-ink-muted">
										<button
											type="button"
											onClick={() => setShowRows((v) => !v)}
											className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
										>
											<ChevronDown className={`h-4 w-4 transition-transform ${showRows ? "rotate-180" : ""}`} />
											{showRows
												? "Show fewer"
												: `+ ${num(plan.payments - rows.length)} more`}
										</button>
									</li>
								)}
							</ul>

							<div className="grid grid-cols-2 gap-2">
								<button type="button" onClick={copyPlan} className="btn-secondary !px-3 whitespace-nowrap">
									{copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
									{copied ? "Copied" : "Copy plan"}
								</button>
								<button type="button" onClick={downloadCsv} className="btn-secondary !px-3 whitespace-nowrap">
									<Download className="h-4 w-4" />
									Download CSV
								</button>
							</div>
						</div>

						{/* Progress tracker */}
						{plan.payments > 1 && (
							<div className="surface space-y-3 p-4 sm:p-5">
								<div className="flex items-baseline justify-between gap-2">
									<p className="label-text">Track what you’ve received</p>
									<p className="text-sm tabular-nums text-ink-soft">
										{num(received)} / {num(plan.payments)} · {inr(receivedAmount)}
									</p>
								</div>
								<div
									className="h-2 overflow-hidden rounded-full bg-line"
									role="progressbar"
									aria-valuemin={0}
									aria-valuemax={plan.payments}
									aria-valuenow={received}
									aria-label="Payments received"
								>
									<div
										className="h-full rounded-full bg-brand-700 transition-[width]"
										style={{ width: `${(received / plan.payments) * 100}%` }}
									/>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{[
										["+1", 1],
										["+10", 10],
										...(plan.payments >= 100 ? [["+50", 50]] : []),
										["−1", -1],
									].map(([label, step]) => (
										<button
											key={label as string}
											type="button"
											onClick={() => updateReceived(received + (step as number))}
											className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm font-semibold text-ink-soft hover:border-ink-muted"
										>
											{label}
										</button>
									))}
									<button
										type="button"
										onClick={() => updateReceived(0)}
										className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink"
									>
										Reset
									</button>
								</div>
								<p className="text-xs text-ink-muted">Saved on this device only.</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};
