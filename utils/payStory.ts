export type Occasion = "gift" | "shagun" | "dinner" | "birthday";

export const OCCASIONS: Record<Occasion, { label: string; emoji: string; done: string }> = {
	gift: { label: "Group gift", emoji: "🎁", done: "The gift box is full" },
	shagun: { label: "Shagun", emoji: "💌", done: "The envelope is open" },
	dinner: { label: "Dinner split", emoji: "🧾", done: "Every share is paid" },
	birthday: { label: "Birthday", emoji: "🎂", done: "All the candles are lit" },
};

export const isOccasion = (v: unknown): v is Occasion =>
	typeof v === "string" && v in OCCASIONS;

/** Everything lives in the share link's #fragment: no server ever sees it. */
export interface PayRequest {
	occasion: Occasion;
	title: string;
	/** Organiser's name, shown beside their UPI ID. */
	name: string;
	upiId: string;
	/** Goal in whole rupees. */
	target: number;
	/** Split evenly between this many people; 0 lets each friend pick an amount. */
	people: number;
	/** Payments friends have recorded, as [first name, rupees]. */
	paid: [string, number][];
}

const toBase64Url = (text: string) => {
	const bytes = new TextEncoder().encode(text);
	let bin = "";
	bytes.forEach((b) => (bin += String.fromCharCode(b)));
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string) => {
	const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
	const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
	return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export const encodeRequest = (req: PayRequest): string => toBase64Url(JSON.stringify(req));

/** Parses and sanitises a fragment; returns null for anything malformed. */
export function decodeRequest(fragment: string): PayRequest | null {
	try {
		const raw = JSON.parse(fromBase64Url(fragment));
		const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
		const int = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : 0);
		if (!isOccasion(raw.occasion) || int(raw.target) < 1) return null;
		const paid: [string, number][] = Array.isArray(raw.paid)
			? raw.paid
					.filter((p: unknown) => Array.isArray(p) && int(p[1]) > 0)
					.slice(0, 200)
					.map((p: [unknown, unknown]) => [str(p[0], 30), int(p[1])])
			: [];
		return {
			occasion: raw.occasion,
			title: str(raw.title, 60),
			name: str(raw.name, 40),
			upiId: str(raw.upiId, 80),
			target: int(raw.target),
			people: Math.min(int(raw.people), 100),
			paid,
		};
	} catch {
		return null;
	}
}

export const totalPaid = (req: PayRequest) => req.paid.reduce((sum, [, amt]) => sum + amt, 0);

/** Fixed share per person (rounded up), or 0 when friends pick their own amount. */
export const sharePerPerson = (req: Pick<PayRequest, "target" | "people">) =>
	req.people > 0 ? Math.ceil(req.target / req.people) : 0;
