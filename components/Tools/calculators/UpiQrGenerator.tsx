"use client";

import { useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import { buildUpiLink, isValidUpiId } from "@/utils/upi";
import { fieldClass, labelClass, useTrackResult } from "./shared";
import { UpiQrCard } from "./UpiQrCard";
import { track } from "@/lib/analytics";

/** UPI QR + pay link from a UPI ID, optional amount and note. All local. */
export const UpiQrGenerator = () => {
	const [upiId, setUpiId] = useState("");
	const [name, setName] = useState("");
	const [amount, setAmount] = useState("");
	const [note, setNote] = useState("");
	const engagedRef = useRef(false);

	const engaged = () => {
		if (engagedRef.current) return;
		engagedRef.current = true;
		track("tool_calculator_engaged", { tool: "upi-qr-code-generator" });
	};

	const valid = isValidUpiId(upiId);
	const value = parseFloat(amount);
	const link = useMemo(
		() =>
			valid
				? buildUpiLink({
						pa: upiId,
						pn: name,
						am: Number.isFinite(value) && value > 0 ? value : undefined,
						tn: note.trim() || undefined,
					})
				: null,
		[valid, upiId, name, value, note]
	);
	useTrackResult("upi-qr-code-generator", !!link);

	const showError = upiId.trim().length > 2 && !valid;

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<div className="surface space-y-4 p-4 sm:p-5">
				<div>
					<label className={labelClass} htmlFor="qr-upi">
						UPI ID
					</label>
					<input
						id="qr-upi"
						className={fieldClass}
						value={upiId}
						onChange={(e) => {
							engaged();
							setUpiId(e.target.value.trim());
						}}
						placeholder="name@okaxis"
						autoCapitalize="none"
						autoCorrect="off"
						spellCheck={false}
						aria-invalid={showError}
						aria-describedby={showError ? "qr-upi-error" : undefined}
					/>
					{showError && (
						<p id="qr-upi-error" className="mt-1 text-xs text-negative">
							A UPI ID looks like name@bank — for example priya@okaxis or 9876543210@ybl.
						</p>
					)}
				</div>
				<div>
					<label className={labelClass} htmlFor="qr-name">
						Name shown to the payer <span className="font-normal text-ink-muted">(optional)</span>
					</label>
					<input
						id="qr-name"
						className={fieldClass}
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Priya Sharma"
						maxLength={40}
					/>
				</div>
				<div>
					<label className={labelClass} htmlFor="qr-amount">
						Amount (₹) <span className="font-normal text-ink-muted">(optional — leave blank to let the payer enter it)</span>
					</label>
					<input
						id="qr-amount"
						className={fieldClass}
						inputMode="decimal"
						value={amount}
						onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
						placeholder="500"
					/>
				</div>
				<div>
					<label className={labelClass} htmlFor="qr-note">
						Note <span className="font-normal text-ink-muted">(optional)</span>
					</label>
					<input
						id="qr-note"
						className={fieldClass}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Rent for October"
						maxLength={50}
					/>
				</div>
				<p className="flex items-start gap-2 text-xs text-ink-muted">
					<Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>
						Everything is generated in your browser — your UPI ID is never uploaded. This is a
						standard UPI payment link, not a merchant QR from a bank or payment provider.
					</span>
				</p>
			</div>

			<div className="surface shadow-raised p-4 sm:p-5" aria-live="polite">
				{link ? (
					<div className="space-y-3">
						<div className="text-center">
							<p className="label-text">Scan to pay</p>
							<p className="font-display text-xl font-semibold text-ink">
								{name.trim() || upiId}
							</p>
							<p className="text-sm text-ink-muted">
								{value > 0 ? `₹${value.toLocaleString("en-IN")}` : "Any amount"}
								{note.trim() && ` · ${note.trim()}`}
							</p>
						</div>
						<UpiQrCard
							link={link}
							label={`UPI QR code for ${upiId}`}
							filename={`upi-qr-${upiId.split("@")[0]}.png`}
						/>
					</div>
				) : (
					<div className="flex h-full min-h-[16rem] items-center justify-center text-center text-sm text-ink-muted">
						Enter your UPI ID to generate the QR code.
					</div>
				)}
			</div>
		</div>
	);
};
