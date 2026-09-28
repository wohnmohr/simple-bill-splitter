/** Build a standard UPI intent URL (opens GPay / PhonePe / etc.). */
export function buildUpiLink(opts: {
	pa: string;
	pn: string;
	am: number;
	tn?: string;
}): string | null {
	const pa = opts.pa.trim();
	if (pa.length < 3 || !pa.includes("@")) return null;

	const params = new URLSearchParams({
		pa,
		pn: opts.pn.trim() || "SplitBiller",
		am: opts.am.toFixed(2),
		cu: "INR",
	});
	if (opts.tn) {
		params.set("tn", opts.tn.slice(0, 50));
	}
	return `upi://pay?${params.toString()}`;
}

/** A UPI VPA is handle@provider, e.g. priya@okaxis or 98xxxxxx10@ybl. */
export const isValidUpiId = (value: string): boolean =>
	/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(value.trim());
