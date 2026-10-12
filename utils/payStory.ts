/** Starting points for a split. Amounts are suggestions the organiser can edit. */
export interface SplitTemplate {
	id: string;
	emoji: string;
	label: string;
	title: string;
	target?: number;
	/** Split evenly between this many; omit to let friends choose an amount. */
	people?: number;
}

export const TEMPLATES: SplitTemplate[] = [
	{ id: "dinner", emoji: "🍽️", label: "Dinner / outing", title: "Dinner tonight", target: 3000, people: 5 },
	{ id: "rent", emoji: "🔑", label: "Flat rent", title: "This month’s rent", target: 24000, people: 3 },
	{ id: "groceries", emoji: "🛒", label: "Groceries", title: "Groceries this week", target: 2400, people: 4 },
	{ id: "electricity", emoji: "💡", label: "Electricity", title: "Electricity bill", target: 3600, people: 3 },
	{ id: "wifi", emoji: "📶", label: "Wi-Fi / utilities", title: "Wi-Fi and utilities", target: 1500, people: 3 },
	{ id: "subscription", emoji: "📺", label: "Subscription", title: "Shared subscription", target: 649, people: 4 },
	{ id: "cab", emoji: "🚕", label: "Cab / fuel", title: "Cab ride home", target: 800, people: 4 },
	{ id: "trip", emoji: "🧳", label: "Trip", title: "Trip advance booking", target: 20000, people: 4 },
	{ id: "sports", emoji: "🏏", label: "Turf / sports", title: "Turf booking", target: 2400, people: 10 },
	{ id: "lunch", emoji: "🥡", label: "Office lunch", title: "Team lunch", target: 2000, people: 8 },
	{ id: "gift", emoji: "🎁", label: "Group gift", title: "Group gift", target: 5000 },
	{ id: "party", emoji: "🎂", label: "Birthday / party", title: "Birthday cake and party", target: 2500 },
	{ id: "shagun", emoji: "💌", label: "Shagun / wedding", title: "Shagun for the wedding", target: 11000 },
	{ id: "other", emoji: "✨", label: "Something else", title: "" },
];

export const getTemplate = (id: unknown): SplitTemplate =>
	TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1];

/** Everything lives in the share link's #fragment: no server ever sees it. */
export interface PayRequest {
	/** Template id; picks the emoji and label. */
	kind: string;
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
		if (int(raw.target) < 1) return null;
		const paid: [string, number][] = Array.isArray(raw.paid)
			? raw.paid
					.filter((p: unknown) => Array.isArray(p) && int(p[1]) > 0)
					.slice(0, 200)
					.map((p: [unknown, unknown]) => [str(p[0], 30), int(p[1])])
			: [];
		return {
			kind: getTemplate(raw.kind).id,
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
