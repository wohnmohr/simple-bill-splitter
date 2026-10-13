export interface SplitFaq {
	q: string;
	a: string;
}

/** The visual scene a split page is built around. */
export type SplitLayout = "receipt" | "ledger" | "meter" | "profiles" | "pass" | "scoreboard" | "jar" | "envelope";

/** A split type with its own page at /split/<id>: scene, theme, copy and sensible defaults. */
export interface SplitTemplate {
	id: string;
	layout: SplitLayout;
	emoji: string;
	label: string;
	/** Default title for the request; the organiser can edit it. */
	title: string;
	target?: number;
	/** Split evenly between this many; omit to let friends choose an amount. */
	people?: number;
	/** Singular word for one person in this split ("flatmate"). */
	who: string;
	/** Hero gradient and whether text on it is dark. */
	theme: { from: string; to: string; darkText?: boolean };
	headline: string;
	sub: string;
	seoTitle: string;
	seoDescription: string;
	/** Quick amounts shown as chips. */
	presets: number[];
	tips: string[];
	faqs: SplitFaq[];
}

export const TEMPLATES: SplitTemplate[] = [
	{
		id: "dinner",
		layout: "receipt",
		emoji: "🍽️",
		label: "Dinner / outing",
		title: "Dinner tonight",
		target: 3000,
		people: 5,
		who: "friend",
		theme: { from: "#ea580c", to: "#be123c" },
		headline: "Split the dinner bill, skip the awkward maths",
		sub: "Set the total and the headcount. Everyone gets one link and pays you straight through UPI.",
		seoTitle: "Split a Dinner or Restaurant Bill with Friends via UPI",
		seoDescription:
			"Split a dinner or outing bill evenly and send one UPI payment link to the group. See who has paid. Free, no signup.",
		presets: [1500, 3000, 6000],
		tips: [
			"Share the link in the group before the waiter brings the bill, so payments land while everyone is still there.",
			"If one person ordered much more, use the unequal splitter first and enter the total here.",
			"Round the total up if you plan to leave a tip, so the cash is already covered.",
		],
		faqs: [
			{ q: "What if someone ordered more than the others?", a: "This page splits evenly. For unequal shares, work out each amount with the unequal bill splitter, then leave the headcount empty so each friend enters their own amount." },
			{ q: "Do my friends need the app?", a: "No. They open the link and pay with any UPI app. Nothing to install or sign up for." },
		],
	},
	{
		id: "rent",
		layout: "ledger",
		emoji: "🔑",
		label: "Flat rent",
		title: "This month’s rent",
		target: 24000,
		people: 3,
		who: "flatmate",
		theme: { from: "#4f46e5", to: "#0369a1" },
		headline: "Collect the flat rent without chasing anyone",
		sub: "Each flatmate gets their share and a one-tap UPI payment to you. You can see who has paid.",
		seoTitle: "Split Flat Rent Between Flatmates via UPI",
		seoDescription:
			"Split monthly flat rent between roommates and collect each share by UPI with one link. See who has paid. Free, no signup.",
		presets: [18000, 24000, 36000],
		tips: [
			"Send the link on the 1st with the same title each month, so people know what it is.",
			"If rooms are different sizes, leave the headcount empty and let each flatmate enter their own agreed amount.",
			"Person-to-person UPI payments between friends are not affected by the merchant charge on payments above ₹2,000.",
		],
		faqs: [
			{ q: "Can I split rent unevenly?", a: "Yes. Leave the headcount empty. Each flatmate then enters the amount you agreed for their room." },
			{ q: "Is there a limit per UPI payment?", a: "Limits depend on each person’s bank and app. If a payment fails, ask them to pay in two parts." },
		],
	},
	{
		id: "groceries",
		layout: "receipt",
		emoji: "🛒",
		label: "Groceries",
		title: "Groceries this week",
		target: 2400,
		people: 4,
		who: "housemate",
		theme: { from: "#15803d", to: "#0f766e" },
		headline: "Split the grocery run in one tap",
		sub: "Whoever paid the cashier shares one link. The rest pay their part by UPI.",
		seoTitle: "Split Grocery Bills with Housemates via UPI",
		seoDescription:
			"Split a grocery or Blinkit/Zepto order between housemates and collect each share by UPI. Free, no signup.",
		presets: [1200, 2400, 4000],
		tips: [
			"Post the link right after the order so the amount is fresh in everyone’s mind.",
			"For a shared kitchen, make a weekly request with the same title and reuse the link layout.",
			"Add delivery and handling fees to the total before you create the link.",
		],
		faqs: [
			{ q: "Does it work for quick-commerce orders?", a: "Yes. Enter the final order total, including fees, and the number of people sharing." },
			{ q: "What if someone only used a few items?", a: "Leave the headcount empty and let people enter what they owe, or split by item with the unequal splitter first." },
		],
	},
	{
		id: "electricity",
		layout: "meter",
		emoji: "💡",
		label: "Electricity",
		title: "Electricity bill",
		target: 3600,
		people: 3,
		who: "flatmate",
		theme: { from: "#fde68a", to: "#fbbf24", darkText: true },
		headline: "Split the electricity bill fairly",
		sub: "Enter the bill and the number of people. Everyone pays their share by UPI.",
		seoTitle: "Split the Electricity Bill Between Flatmates via UPI",
		seoDescription:
			"Split an electricity bill between flatmates and collect each share by UPI with one link. Free, no signup.",
		presets: [1800, 3600, 6000],
		tips: [
			"Use the exact amount from the bill so there is nothing to argue about.",
			"If you have a sub-meter, use the electricity splitter first and then paste the total here.",
			"Share the link before the due date so no one pays a late fee.",
		],
		faqs: [
			{ q: "What about AC use in one room?", a: "Work out the extra with the electricity splitter, or leave the headcount empty and ask each person to enter their own amount." },
			{ q: "Can I reuse this next month?", a: "Create a new link each month. It takes under a minute and the title stays the same." },
		],
	},
	{
		id: "wifi",
		layout: "ledger",
		emoji: "📶",
		label: "Wi-Fi / utilities",
		title: "Wi-Fi and utilities",
		target: 1500,
		people: 3,
		who: "flatmate",
		theme: { from: "#0284c7", to: "#4338ca" },
		headline: "Split Wi-Fi, gas and water in one go",
		sub: "Add up the monthly utilities, pick the headcount and share a single payment link.",
		seoTitle: "Split Wi-Fi and Utility Bills via UPI",
		seoDescription:
			"Split broadband, gas, water and other flat utilities between flatmates and collect shares by UPI. Free, no signup.",
		presets: [800, 1500, 2500],
		tips: [
			"Combine broadband, gas and water into one total so people pay once a month.",
			"Keep the title specific, like “Wi-Fi + gas, October”, so no one has to ask what it’s for.",
			"Share it the same day the bills arrive.",
		],
		faqs: [
			{ q: "Can I combine several bills?", a: "Yes. Add them up and enter one total. Mention what’s included in the title." },
			{ q: "What if someone moves out mid-month?", a: "Change the headcount before you create the link, or leave it empty and set amounts by hand." },
		],
	},
	{
		id: "subscription",
		layout: "profiles",
		emoji: "📺",
		label: "Subscription",
		title: "Shared subscription",
		target: 649,
		people: 4,
		who: "member",
		theme: { from: "#e11d48", to: "#86198f" },
		headline: "Split a shared subscription fairly",
		sub: "Netflix, Spotify, YouTube Premium or a team tool. One link, everyone pays their cut.",
		seoTitle: "Split a Shared Subscription Cost via UPI",
		seoDescription:
			"Split the cost of a shared streaming or software subscription between members and collect shares by UPI. Free, no signup.",
		presets: [199, 649, 1499],
		tips: [
			"Check the plan’s terms. Some services only allow sharing within one household.",
			"Create the link a few days before renewal so the money is in before the charge.",
			"Round up per-person amounts so the organiser is never out of pocket.",
		],
		faqs: [
			{ q: "Why is each share rounded up?", a: "Dividing by the headcount rarely gives whole rupees. Rounding up means the total collected covers the cost." },
			{ q: "Can I run this monthly?", a: "Yes. Make a fresh link each billing cycle with the same title." },
		],
	},
	{
		id: "cab",
		layout: "pass",
		emoji: "🚕",
		label: "Cab / fuel",
		title: "Cab ride home",
		target: 800,
		people: 4,
		who: "rider",
		theme: { from: "#fde047", to: "#fbbf24", darkText: true },
		headline: "Split the cab fare before everyone leaves",
		sub: "Put in the fare, pick how many rode, and share a link so each rider pays you back.",
		seoTitle: "Split a Cab or Fuel Cost with Friends via UPI",
		seoDescription:
			"Split an Ola, Uber or fuel cost between riders and collect each share by UPI. Free, no signup.",
		presets: [400, 800, 1600],
		tips: [
			"Create the link in the cab, before the ride ends, while everyone is together.",
			"For fuel on a long drive, use the road-trip splitter and share the result here.",
			"Include tolls and waiting charges in the total.",
		],
		faqs: [
			{ q: "What if people get off at different stops?", a: "Leave the headcount empty and ask each rider to enter what they owe." },
			{ q: "Does this work for fuel too?", a: "Yes. Enter the fuel cost as the total and the number of people sharing." },
		],
	},
	{
		id: "trip",
		layout: "pass",
		emoji: "🧳",
		label: "Trip",
		title: "Trip advance booking",
		target: 20000,
		people: 4,
		who: "traveller",
		theme: { from: "#0f766e", to: "#1d4ed8" },
		headline: "Collect trip money before you book",
		sub: "Hotels and tickets need money up front. Share one link so the group pays you before the deadline.",
		seoTitle: "Collect Trip Advance Money from Friends via UPI",
		seoDescription:
			"Collect hotel, ticket or advance booking money for a group trip with one UPI link. See who has paid. Free, no signup.",
		presets: [10000, 20000, 50000],
		tips: [
			"Collect before you book, so no one is left covering a cancelled booking.",
			"For one big payment per person, ask friends to pay in parts if their app has a daily limit.",
			"After the trip, use the trip expense splitter to settle the on-the-ground costs.",
		],
		faqs: [
			{ q: "Is there a payment cap?", a: "Each bank and UPI app sets its own daily limit. Ask friends to pay in parts if a large amount fails." },
			{ q: "How do I settle costs during the trip?", a: "Use the trip expense splitter. It tracks who paid what and shows the fewest payments to settle." },
		],
	},
	{
		id: "sports",
		layout: "scoreboard",
		emoji: "🏏",
		label: "Turf / sports",
		title: "Turf booking",
		target: 2400,
		people: 10,
		who: "player",
		theme: { from: "#4d7c0f", to: "#166534" },
		headline: "Split the turf booking among the team",
		sub: "Cricket, football or badminton. One link, each player pays their share to you.",
		seoTitle: "Split Turf and Sports Booking Costs via UPI",
		seoDescription:
			"Split turf, court or ground booking costs between players and collect each share by UPI. Free, no signup.",
		presets: [1200, 2400, 4000],
		tips: [
			"Share the link when you book, not after the game, so late payers don’t slip through.",
			"Count substitutes in the headcount only if they’ll pay.",
			"Keep one title per venue, like “Turf, Saturday 7am”.",
		],
		faqs: [
			{ q: "What if a player drops out?", a: "Change the headcount and create a new link. Shares recalculate instantly." },
			{ q: "Can the same group reuse it weekly?", a: "Yes. Create a new link each booking." },
		],
	},
	{
		id: "lunch",
		layout: "receipt",
		emoji: "🥡",
		label: "Office lunch",
		title: "Team lunch",
		target: 2000,
		people: 8,
		who: "teammate",
		theme: { from: "#b45309", to: "#9a3412" },
		headline: "Split the team lunch without a spreadsheet",
		sub: "Order together, pay together. One link in the team chat covers everyone.",
		seoTitle: "Split Office Lunch Orders with Colleagues via UPI",
		seoDescription:
			"Split a team lunch or office order between colleagues and collect each share by UPI. Free, no signup.",
		presets: [1000, 2000, 4000],
		tips: [
			"Post the link in the team chat as soon as the order is placed.",
			"Include delivery fees and taxes in the total.",
			"For a regular lunch group, keep one person as the organiser each week and rotate.",
		],
		faqs: [
			{ q: "Is this suitable for work?", a: "Yes. Nobody needs an account, and the split is end-to-end encrypted: it’s locked in your browser before it’s saved, and only people with the link can read it." },
			{ q: "What if a few people didn’t eat?", a: "Count only the people eating in the headcount." },
		],
	},
	{
		id: "gift",
		layout: "jar",
		emoji: "🎁",
		label: "Group gift",
		title: "Group gift",
		target: 5000,
		who: "contributor",
		theme: { from: "#be185d", to: "#6d28d9" },
		headline: "Chip in together for a group gift",
		sub: "Everyone gives what they can. A progress bar shows how close you are to the goal.",
		seoTitle: "Collect Money for a Group Gift via UPI",
		seoDescription:
			"Collect contributions for a group gift or farewell with one UPI link. Everyone pays what they can. Free, no signup.",
		presets: [2000, 5000, 10000],
		tips: [
			"Set the goal as the gift price and let people pick their own amounts.",
			"Share the link privately if the gift is a surprise.",
			"Close it once the goal is met and share the “we did it” link.",
		],
		faqs: [
			{ q: "Can people give different amounts?", a: "Yes. With no headcount set, each person enters whatever they want to give." },
			{ q: "Will the recipient see it?", a: "Only if you send them the link. Share it only with the group." },
		],
	},
	{
		id: "party",
		layout: "jar",
		emoji: "🎂",
		label: "Birthday / party",
		title: "Birthday cake and party",
		target: 2500,
		who: "guest",
		theme: { from: "#db2777", to: "#c2410c" },
		headline: "Split the birthday party costs",
		sub: "Cake, decorations and snacks. Share one link and watch the goal fill up.",
		seoTitle: "Split Birthday and Party Costs with Friends via UPI",
		seoDescription:
			"Collect money for a birthday cake, decor and party costs from friends with one UPI link. Free, no signup.",
		presets: [1500, 2500, 5000],
		tips: [
			"Add up cake, decor and snacks into one goal before you share.",
			"If it’s a surprise, create the link yourself and send it only to the guests.",
			"Share the progress to nudge the last few people.",
		],
		faqs: [
			{ q: "Can guests pay different amounts?", a: "Yes. Leave the headcount empty and each guest picks their own amount." },
			{ q: "Can I see who paid?", a: "Yes. Guests tap “I’ve paid” and enter their first name. Share the updated link to show everyone." },
		],
	},
	{
		id: "shagun",
		layout: "envelope",
		emoji: "💌",
		label: "Shagun / wedding",
		title: "Shagun for the wedding",
		target: 11000,
		who: "friend",
		theme: { from: "#9f1239", to: "#b45309" },
		headline: "Pool shagun from the whole group",
		sub: "Friends and colleagues chip in for one shagun. Everyone gives what suits them.",
		seoTitle: "Pool Shagun or Wedding Gift Money via UPI",
		seoDescription:
			"Collect shagun or wedding gift contributions from friends and colleagues with one UPI link. Free, no signup.",
		presets: [5100, 11000, 21000],
		tips: [
			"Pick a goal that ends in 1, like ₹11,000, to match the shagun tradition.",
			"Let people give what they can by leaving the headcount empty.",
			"Share the link once and close it by a set date.",
		],
		faqs: [
			{ q: "Does it track who gave how much?", a: "Anyone can record their payment with their first name, and the organiser can see it in the updated link." },
			{ q: "Is it safe to share?", a: "Only share with people you know. The link contains your UPI ID, so treat it like giving out your payment details." },
		],
	},
	{
		id: "other",
		layout: "ledger",
		emoji: "✨",
		label: "Something else",
		title: "",
		who: "person",
		theme: { from: "#53307b", to: "#6d28d9" },
		headline: "Split anything with a single link",
		sub: "Name it, set the amount and share. Friends pay you directly by UPI.",
		seoTitle: "Create a Shareable UPI Split for Anything",
		seoDescription:
			"Create a custom split for any shared cost and collect each share by UPI with one link. Free, no signup.",
		presets: [1000, 5000, 10000],
		tips: [
			"Give the split a clear title so people know what they are paying for.",
			"Set a headcount for an even split, or leave it empty for free contributions.",
			"Share the link in the group and ask people to tap “I’ve paid” after they pay.",
		],
		faqs: [
			{ q: "Does money pass through SplitBiller?", a: "No. Payments go straight from your friends’ UPI app to yours. SplitBiller only builds the link." },
			{ q: "Where is the split stored?", a: "In the cloud, end-to-end encrypted. It’s locked in your browser before upload and the key stays in your link, so SplitBiller can’t read it. That’s also how payments update live for everyone." },
		],
	},
];

export const getTemplate = (id: unknown): SplitTemplate =>
	TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1];

export const findTemplate = (id: string): SplitTemplate | undefined => TEMPLATES.find((t) => t.id === id);

/** A split request. Stored end-to-end encrypted in the cloud, or (older links) inside the link’s #fragment. */
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

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const int = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : 0);

/** One recorded payment from untrusted input, or null. */
export function sanitizePayment(p: unknown): [string, number] | null {
	if (!Array.isArray(p) || int(p[1]) < 1) return null;
	return [str(p[0], 30), int(p[1])];
}

/** Validates a request from untrusted input (a link or a decrypted blob); null if malformed. */
export function sanitizeRequest(raw: unknown): PayRequest | null {
	if (!raw || typeof raw !== "object") return null;
	const r = raw as Record<string, unknown>;
	if (int(r.target) < 1) return null;
	const paid = Array.isArray(r.paid)
		? r.paid.slice(0, 200).map(sanitizePayment).filter((x): x is [string, number] => x !== null)
		: [];
	return {
		kind: getTemplate(r.kind).id,
		title: str(r.title, 60),
		name: str(r.name, 40),
		upiId: str(r.upiId, 80),
		target: int(r.target),
		people: Math.min(int(r.people), 100),
		paid,
	};
}

/** Parses and sanitises a link-only fragment; returns null for anything malformed. */
export function decodeRequest(fragment: string): PayRequest | null {
	try {
		return sanitizeRequest(JSON.parse(fromBase64Url(fragment)));
	} catch {
		return null;
	}
}

export const totalPaid = (req: PayRequest) => req.paid.reduce((sum, [, amt]) => sum + amt, 0);

/** Fixed share per person (rounded up), or 0 when friends pick their own amount. */
export const sharePerPerson = (req: Pick<PayRequest, "target" | "people">) =>
	req.people > 0 ? Math.ceil(req.target / req.people) : 0;
