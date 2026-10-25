/** Build a standard UPI intent URL (opens GPay / PhonePe / etc.). */
export function buildUpiLink(opts: {
	pa: string;
	pn: string;
	/** Omit to let the payer type the amount. */
	am?: number;
	tn?: string;
}): string | null {
	const pa = opts.pa.trim();
	if (!isValidUpiId(pa)) return null;

	const params = new URLSearchParams({
		pa,
		pn: opts.pn.trim() || "SplitBiller",
		cu: "INR",
	});
	if (opts.am !== undefined && opts.am > 0) params.set("am", opts.am.toFixed(2));
	if (opts.tn) {
		// 50 characters, not UTF-16 units, so an emoji is never cut in half.
		params.set("tn", Array.from(opts.tn).slice(0, 50).join(""));
	}
	// UPI apps read "+" literally, so spaces go out as %20 ("+" itself is already %2B).
	return `upi://pay?${params.toString().replace(/\+/g, "%20")}`;
}

/**
 * UPI apps often refuse pay links to a personal UPI ID above ₹2,000 (unsigned
 * links are treated as risky) and blame a "bank limit". Paying the same UPI ID
 * from inside the app still works, so above this amount we offer that way too.
 */
export const UPI_LINK_LIMIT = 2000;
export const overUpiLinkLimit = (amount: number): boolean => amount > UPI_LINK_LIMIT;

/** The same advice for messages, where there's no button to copy with. */
export const UPI_LIMIT_TIP = "Over ₹2,000, UPI apps can block pay links. If yours does, pay the UPI ID from inside the app.";

/** A UPI VPA is handle@provider, e.g. priya@okaxis, 98xxxxxx10@ybl or asha@kotak811. */
export const isValidUpiId = (value: string): boolean =>
	/^[\w.\-]{2,}@[a-zA-Z][a-zA-Z0-9]{1,}$/.test(value.trim());
