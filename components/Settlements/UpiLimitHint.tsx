"use client";

import { useState } from "react";
import { overUpiLinkLimit } from "@/utils/upi";

/** Above ₹2,000 UPI apps may block the pay link, so offer paying the UPI ID inside the app. */
export const UpiLimitHint = ({ upiId, amount, className = "text-sm text-ink-muted" }: { upiId: string; amount: number; className?: string }) => {
	const [copied, setCopied] = useState(false);
	if (!overUpiLinkLimit(amount)) return null;

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(upiId);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* clipboard blocked: the UPI ID is still on screen */
		}
	};

	return (
		<p className={className} aria-live="polite">
			Limit error in your UPI app? Apps often block pay links over ₹2,000.{" "}
			<button type="button" onClick={copy} className="font-semibold underline underline-offset-2">
				{copied ? "UPI ID copied" : "Copy the UPI ID"}
			</button>{" "}
			and pay from inside the app instead.
		</p>
	);
};
