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

export function isValidUpiId(value: string): boolean {
	const v = value.trim();
	return v.length >= 3 && v.includes("@");
}
