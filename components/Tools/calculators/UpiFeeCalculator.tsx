"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { CURRENCIES } from "@/constants";
import { formatCurrency } from "@/utils/formatting";
import {
	MDR_EFFECTIVE_DATE,
	MDR_FREE_LIMIT,
	MDR_RULES,
	MerchantType,
	SMALL_MERCHANT_MONTHLY_LIMIT,
	upiMdr,
} from "@/utils/upiFees";
import { fieldClass, labelClass } from "./shared";
import { track } from "@/lib/analytics";

const INR = CURRENCIES.find((c) => c.code === "INR")!;
const inr = (n: number) => formatCurrency(n, INR);

const Segmented = <T extends string>({
	value,
	onChange,
	options,
}: {
	value: T;
	onChange: (v: T) => void;
	options: readonly (readonly [T, string])[];
}) => (
	<div className="grid grid-cols-2 gap-2">
		{options.map(([id, label]) => (
			<button
				key={id}
				type="button"
				aria-pressed={value === id}
				onClick={() => onChange(id)}
				className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
					value === id
						? "border-brand-700 bg-brand-700 text-white"
						: "border-line-strong bg-white text-ink-soft hover:border-ink-muted"
				}`}
			>
				{label}
			</button>
		))}
	</div>
);

const Disclaimer = () => (
	<p className="flex items-start gap-2 text-xs text-ink-muted">
		<Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
		<span>
			Based on the NPCI MDR framework effective {MDR_EFFECTIVE_DATE}, as publicly
			reported. Excludes GST and provider charges. Rules can change — confirm
			with NPCI or your bank/payment provider.
		</span>
	</p>
);

/** Reports first interaction once, so usage is measurable without noise. */
const useEngaged = (tool: string) => {
	const done = useRef(false);
	return () => {
		if (done.current) return;
		done.current = true;
		track("tool_calculator_engaged", { tool });
	};
};

/** "Do I pay?" checker for people paying by UPI — the answer is almost always no. */
const CustomerChecker = () => {
	const engaged = useEngaged("upi-charges-above-2000");
	const [amount, setAmount] = useState("5000");
	const [payee, setPayee] = useState<"friend" | "merchant">("friend");
	const value = parseFloat(amount) || 0;
	const merchantFee = upiMdr(value, "standard", false).fee;

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<div className="surface space-y-4 p-4 sm:p-5">
				<div>
					<label className={labelClass} htmlFor="upi-amount">
						Payment amount (₹)
					</label>
					<input
						id="upi-amount"
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
					<span className={labelClass}>Who are you paying?</span>
					<Segmented
						value={payee}
						onChange={(v) => {
							engaged();
							setPayee(v);
						}}
						options={[
							["friend", "A friend / family"],
							["merchant", "A shop or business"],
						]}
					/>
				</div>
				<Disclaimer />
			</div>

			<div className="surface shadow-raised space-y-4 p-4 sm:p-5" aria-live="polite">
				<div>
					<p className="label-text">Extra charge to you</p>
					<p className="font-display text-4xl font-semibold text-positive">₹0</p>
				</div>
				<p className="text-sm text-ink-soft">
					{payee === "friend"
						? "Person-to-person UPI transfers are free, at any amount. Splitting a bill by sending your share to the friend who paid is not affected."
						: value <= MDR_FREE_LIMIT
						? `Payments up to ${inr(MDR_FREE_LIMIT)} to a merchant are free for you and for them.`
						: `You pay the listed price. The merchant's side may bear a fee of up to about ${inr(
								merchantFee
						  )} on this payment (0.4%, capped at ₹300) — and nothing at all if they receive ${inr(
								SMALL_MERCHANT_MONTHLY_LIMIT
						  )} or less a month over UPI.`}
				</p>
				<Link
					href="/upi-bill-splitter"
					onClick={() => track("calculator_continue_clicked", { tool: "upi-charges-above-2000", destination: "/upi-bill-splitter" })}
					className="btn-primary w-full"
				>
					Splitting a bill? Calculate &amp; pay by UPI
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</div>
	);
};

/** MDR calculator for merchants. */
const MerchantCalculator = () => {
	const engaged = useEngaged("upi-mdr-calculator");
	const [amount, setAmount] = useState("5000");
	const [type, setType] = useState<MerchantType>("standard");
	const [small, setSmall] = useState(false);
	const [count, setCount] = useState("100");

	const value = parseFloat(amount) || 0;
	const payments = Math.max(0, Math.floor(parseFloat(count) || 0));
	const { fee, reason } = upiMdr(value, type, small);
	const effective = value > 0 ? (fee / value) * 100 : 0;

	const explanation = {
		within_free_limit: `Payments up to ${inr(MDR_FREE_LIMIT)} carry no MDR.`,
		small_merchant: `Merchants receiving up to ${inr(
			SMALL_MERCHANT_MONTHLY_LIMIT
		)} a month over UPI pay no MDR.`,
		charged: (() => {
			const r = MDR_RULES[type];
			return r.flat !== undefined
				? `Flat ${inr(r.flat)} per payment above ${inr(MDR_FREE_LIMIT)}.`
				: `${r.rate}% of the payment, capped at ${inr(r.cap ?? 0)}.`;
		})(),
	}[reason];

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<div className="surface space-y-4 p-4 sm:p-5">
				<div>
					<label className={labelClass} htmlFor="mdr-amount">
						Payment amount (₹)
					</label>
					<input
						id="mdr-amount"
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
					<label className={labelClass} htmlFor="mdr-type">
						Merchant type
					</label>
					<select
						id="mdr-type"
						className={fieldClass}
						value={type}
						onChange={(e) => {
							engaged();
							setType(e.target.value as MerchantType);
						}}
					>
						{(Object.keys(MDR_RULES) as MerchantType[]).map((k) => (
							<option key={k} value={k}>
								{MDR_RULES[k].label}
							</option>
						))}
					</select>
				</div>
				<label className="flex items-start gap-2.5 text-sm text-ink-soft">
					<input
						type="checkbox"
						checked={small}
						onChange={(e) => {
							engaged();
							setSmall(e.target.checked);
						}}
						className="mt-0.5 h-4 w-4 rounded border-line-strong accent-brand-700"
					/>
					My UPI receipts are {inr(SMALL_MERCHANT_MONTHLY_LIMIT)} a month or less
				</label>
				<div>
					<label className={labelClass} htmlFor="mdr-count">
						Payments like this per month
					</label>
					<input
						id="mdr-count"
						className={fieldClass}
						inputMode="numeric"
						value={count}
						onChange={(e) => {
							engaged();
							setCount(e.target.value);
						}}
					/>
				</div>
				<Disclaimer />
			</div>

			<div className="surface shadow-raised space-y-4 p-4 sm:p-5" aria-live="polite">
				<div>
					<p className="label-text">MDR on this payment</p>
					<p className={`font-display text-4xl font-semibold ${fee ? "text-ink" : "text-positive"}`}>
						{inr(fee)}
					</p>
					<p className="mt-1 text-sm text-ink-muted">{explanation}</p>
				</div>
				<dl className="divide-y divide-line rounded-xl border border-line text-sm">
					{[
						["Effective rate", `${effective.toFixed(2)}%`],
						["You receive", inr(Math.max(0, value - fee))],
						[`Cost over ${payments} payment${payments === 1 ? "" : "s"}`, inr(fee * payments)],
					].map(([k, v]) => (
						<div key={k} className="flex items-center justify-between gap-3 px-3 py-2.5">
							<dt className="text-ink-muted">{k}</dt>
							<dd className="font-semibold tabular-nums text-ink">{v}</dd>
						</div>
					))}
				</dl>
				{fee > 0 && (
					<Link
						href="/upi-payment-split-planner"
						className="flex items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2.5 text-sm font-medium text-brand-700 hover:underline"
					>
						Plan this as payments of ₹2,000 or less
						<ArrowRight className="h-4 w-4 shrink-0" />
					</Link>
				)}
			</div>
		</div>
	);
};

export const UpiFeeCalculator = ({ audience }: { audience: "customer" | "merchant" }) =>
	audience === "customer" ? <CustomerChecker /> : <MerchantCalculator />;
