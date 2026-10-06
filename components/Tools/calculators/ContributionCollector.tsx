"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Info } from "lucide-react";
import { CURRENCIES } from "@/constants";
import { formatCurrency } from "@/utils/formatting";
import { buildUpiLink, isValidUpiId } from "@/utils/upi";
import { fieldClass, labelClass, useCopy, useTrackResult } from "./shared";
import { UpiQrCard } from "./UpiQrCard";
import { track } from "@/lib/analytics";

const INR = CURRENCIES.find((c) => c.code === "INR")!;
const inr = (n: number) => formatCurrency(n, INR);
const STORAGE_KEY = "splitbiller-collector";
const ROUND_OPTIONS = [1, 10, 50, 100] as const;

/**
 * Equal contributions for a gift, festival or event: per-person share (rounded
 * up so the target is met), a UPI QR for that amount, and a tick-list of who
 * has paid. Ticks stay on this device.
 */
export const ContributionCollector = () => {
	const [purpose, setPurpose] = useState("Farewell gift");
	const [target, setTarget] = useState("6000");
	const [namesText, setNamesText] = useState("Asha\nRohan\nMeera\nKabir\nIsha\nDev\nNeha\nSam");
	const [roundTo, setRoundTo] = useState<(typeof ROUND_OPTIONS)[number]>(50);
	const [upiId, setUpiId] = useState("");
	const [paid, setPaid] = useState<string[]>([]);
	const [copied, copy] = useCopy();
	const engagedRef = useRef(false);

	const engaged = () => {
		if (engagedRef.current) return;
		engagedRef.current = true;
		track("tool_calculator_engaged", { tool: "group-contribution-collector" });
	};

	const names = useMemo(() => {
		const seen = new Set<string>();
		return namesText
			.split(/[\n,]/)
			.map((s) => s.trim())
			.filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
	}, [namesText]);

	const goal = Math.max(0, Math.round(parseFloat(target) || 0));
	const each = names.length > 0 ? Math.ceil(goal / names.length / roundTo) * roundTo : 0;
	const raised = each * names.length;
	const surplus = raised - goal;

	const upiOk = isValidUpiId(upiId);
	const link = upiOk && each > 0 ? buildUpiLink({ pa: upiId, pn: purpose, am: each, tn: purpose }) : null;
	useTrackResult("group-contribution-collector", each > 0);

	// Ticks are remembered for the same group, amount and target only.
	const signature = `${purpose}|${goal}|${roundTo}|${names.join(",")}`;
	useEffect(() => {
		try {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
			setPaid(stored?.sig === signature ? stored.paid : []);
		} catch {
			setPaid([]);
		}
	}, [signature]);

	const toggle = (name: string) => {
		const next = paid.includes(name) ? paid.filter((p) => p !== name) : [...paid, name];
		setPaid(next);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ sig: signature, paid: next }));
		} catch {
			/* works without storage; ticks just aren't remembered */
		}
	};

	const collected = paid.filter((p) => names.includes(p)).length * each;
	const pending = names.filter((p) => !paid.includes(p));

	const message = [
		`🙏 ${purpose}`,
		`${inr(each)} each (${names.length} people).`,
		upiOk ? `Pay by UPI to ${upiId}` : "",
		"Please reply once you've paid.",
	]
		.filter(Boolean)
		.join("\n");
	const reminder = `Gentle reminder for "${purpose}": ${inr(each)} each${
		upiOk ? ` — UPI ${upiId}` : ""
	}. Still pending: ${pending.join(", ") || "nobody 🎉"}.`;

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
			<div className="surface space-y-4 p-4 sm:p-5">
				<div>
					<label className={labelClass} htmlFor="cc-purpose">
						What is it for?
					</label>
					<input
						id="cc-purpose"
						className={fieldClass}
						value={purpose}
						onChange={(e) => {
							engaged();
							setPurpose(e.target.value);
						}}
						maxLength={50}
					/>
				</div>
				<div>
					<label className={labelClass} htmlFor="cc-target">
						Amount to collect (₹)
					</label>
					<input
						id="cc-target"
						className={fieldClass}
						inputMode="numeric"
						value={target}
						onChange={(e) => {
							engaged();
							setTarget(e.target.value.replace(/[^\d]/g, ""));
						}}
					/>
				</div>
				<div>
					<label className={labelClass} htmlFor="cc-names">
						Who’s contributing? <span className="font-normal text-ink-muted">(one per line)</span>
					</label>
					<textarea
						id="cc-names"
						className={fieldClass}
						rows={6}
						value={namesText}
						onChange={(e) => {
							engaged();
							setNamesText(e.target.value);
						}}
					/>
				</div>
				<div>
					<span className={labelClass}>Round each share up to the nearest</span>
					<div className="flex flex-wrap gap-2">
						{ROUND_OPTIONS.map((r) => (
							<button
								key={r}
								type="button"
								aria-pressed={roundTo === r}
								onClick={() => setRoundTo(r)}
								className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
									roundTo === r
										? "border-brand-700 bg-brand-700 text-white"
										: "border-line-strong bg-white text-ink-soft hover:border-ink-muted"
								}`}
							>
								₹{r}
							</button>
						))}
					</div>
				</div>
				<div>
					<label className={labelClass} htmlFor="cc-upi">
						Your UPI ID <span className="font-normal text-ink-muted">(for the QR — optional)</span>
					</label>
					<input
						id="cc-upi"
						className={fieldClass}
						value={upiId}
						onChange={(e) => setUpiId(e.target.value.trim())}
						placeholder="name@okaxis"
						autoCapitalize="none"
						autoCorrect="off"
						spellCheck={false}
					/>
					{upiId.length > 2 && !upiOk && (
						<p className="mt-1 text-xs text-negative">A UPI ID looks like name@bank.</p>
					)}
				</div>
				<p className="flex items-start gap-2 text-xs text-ink-muted">
					<Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>
						Payments go straight to your UPI ID — nothing passes through SplitBiller, and
						nothing here is uploaded. Ticks are saved on this device only.
					</span>
				</p>
			</div>

			<div className="space-y-4" aria-live="polite">
				{each <= 0 ? (
					<div className="surface p-6 text-center text-sm text-ink-muted">
						Add an amount and at least one person.
					</div>
				) : (
					<>
						<div className="surface shadow-raised space-y-4 p-4 sm:p-5">
							<div>
								<p className="label-text">Each person pays</p>
								<p className="font-display text-4xl font-semibold text-ink">{inr(each)}</p>
								<p className="mt-1 text-sm text-ink-muted">
									{names.length} people · {inr(raised)} in total
									{surplus > 0 && ` (${inr(surplus)} over the ${inr(goal)} target)`}
								</p>
							</div>

							<div>
								<div className="mb-1.5 flex items-baseline justify-between text-sm">
									<span className="text-ink-soft">
										{paid.filter((p) => names.includes(p)).length} of {names.length} paid
									</span>
									<span className="font-semibold tabular-nums text-ink">
										{inr(collected)} of {inr(raised)}
									</span>
								</div>
								<div
									className="h-2 overflow-hidden rounded-full bg-line"
									role="progressbar"
									aria-valuemin={0}
									aria-valuemax={names.length}
									aria-valuenow={paid.filter((p) => names.includes(p)).length}
									aria-label="Contributions received"
								>
									<div
										className="h-full rounded-full bg-brand-700 transition-[width]"
										style={{ width: `${raised ? (collected / raised) * 100 : 0}%` }}
									/>
								</div>
							</div>

							<ul className="max-h-80 divide-y divide-line overflow-y-auto rounded-xl border border-line text-sm">
								{names.map((name) => (
									<li key={name}>
										<label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
											<input
												type="checkbox"
												checked={paid.includes(name)}
												onChange={() => toggle(name)}
												className="h-4 w-4 rounded border-line-strong accent-brand-700"
											/>
											<span
												className={`min-w-0 flex-1 truncate ${
													paid.includes(name) ? "text-ink-muted line-through" : "text-ink"
												}`}
											>
												{name}
											</span>
											<span className="tabular-nums text-ink-soft">{inr(each)}</span>
										</label>
									</li>
								))}
							</ul>

							<div className="grid grid-cols-2 gap-2">
								<button type="button" onClick={() => copy(message)} className="btn-secondary !px-3 whitespace-nowrap">
									{copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
									{copied ? "Copied" : "Copy message"}
								</button>
								<button
									type="button"
									onClick={() => copy(reminder)}
									disabled={pending.length === 0}
									className="btn-secondary !px-3 whitespace-nowrap"
								>
									<Copy className="h-4 w-4" />
									Copy reminder
								</button>
							</div>
						</div>

						{link && (
							<div className="surface space-y-3 p-4 sm:p-5">
								<p className="label-text">Scan to pay {inr(each)}</p>
								<UpiQrCard
									link={link}
									label={`UPI QR for ${inr(each)} to ${upiId}`}
									filename={`${purpose.replace(/\W+/g, "-").toLowerCase() || "collection"}-qr.png`}
								/>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};
