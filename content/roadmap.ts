/**
 * The public roadmap at /roadmap. The live copy is the "roadmap" item in the
 * Vercel Edge Config connected to the project (see lib/roadmap.ts), so it can
 * be edited without a deploy; the lists below are the fallback when that is
 * missing, down or malformed. Keep the request form's "Which of these…"
 * checkboxes in Tally (form REQUEST_FORM_ID) in step with NEXT and LATER.
 */

const ICONS = ["repeat", "scan", "globe", "download", "languages"] as const;
export type RoadmapIcon = (typeof ICONS)[number];

export type PlannedItem = { title: string; body: string; icon: RoadmapIcon };
export type ShippedItem = { title: string; href: string };
export type ShippedMonth = { month: string; items: ShippedItem[] };
export type Roadmap = { next: PlannedItem[]; later: PlannedItem[]; shipped: ShippedMonth[] };

/** Being designed or built now. */
export const NEXT: PlannedItem[] = [
	{
		icon: "scan",
		title: "Scan paper restaurant bills",
		body: "Take a photo of a printed bill at the table and SplitBiller fills in the items, the way it reads app screenshots today.",
	},
	{
		icon: "download",
		title: "Export a group",
		body: "Download every expense and settlement as a spreadsheet or a PDF.",
	},
];

/** On the list, after NEXT. */
export const LATER: PlannedItem[] = [
	{
		icon: "globe",
		title: "Trips in more than one currency",
		body: "Add expenses in dollars, euros or baht on a trip abroad, and settle up in rupees.",
	},
	{
		icon: "languages",
		title: "Hindi and more Indian languages",
		body: "SplitBiller in the language your group actually talks in.",
	},
];

/** Most recent first. */
export const SHIPPED: ShippedMonth[] = [
	{
		month: "October 2026",
		items: [
			{ title: "Monthly expenses for rent, Wi-Fi and subscriptions", href: "/features#expenses" },
			{ title: "Payment reminders that open the group on what you owe", href: "/features#sync" },
			{ title: "Scan Swiggy, Zomato and Instamart screenshots (beta)", href: "/split-swiggy-zomato-bill" },
			{ title: "Split a bill item by item", href: "/split-swiggy-zomato-bill" },
			{ title: "Split by exact amounts", href: "/features#expenses" },
			{ title: "Install SplitBiller as an app", href: "/features" },
			{ title: "Join a group without giving your name", href: "/features#join" },
			{ title: "A theme for every group", href: "/features#themes" },
			{ title: "End-to-end encrypted shared groups", href: "/features#sync" },
			{ title: "Split links that collect money by UPI", href: "/features#split-links" },
			{ title: "UPI QR codes, Secret Santa and more free tools", href: "/tools" },
		],
	},
];

/** The Tally form for requests and votes on the items above. */
export const REQUEST_FORM_ID = "2EqQQD";

export const STATIC_ROADMAP: Roadmap = { next: NEXT, later: LATER, shipped: SHIPPED };

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null;
const isText = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const isPlanned = (v: unknown): v is PlannedItem =>
	isObject(v) && isText(v.title) && isText(v.body) && ICONS.includes(v.icon as RoadmapIcon);
// Only links within the site, so an edit can never point a visitor somewhere else.
const isShipped = (v: unknown): v is ShippedItem =>
	isObject(v) && isText(v.title) && typeof v.href === "string" && /^\/(?!\/)/.test(v.href);

/**
 * Reads a roadmap edited by hand, dropping any item that isn't well formed
 * rather than failing the page. Null when it isn't a roadmap at all.
 */
export function parseRoadmap(raw: unknown): Roadmap | null {
	if (!isObject(raw) || !["next", "later", "shipped"].every((k) => Array.isArray(raw[k]))) return null;
	return {
		next: list(raw.next).filter(isPlanned),
		later: list(raw.later).filter(isPlanned),
		shipped: list(raw.shipped)
			.filter((m): m is Json => isObject(m) && isText(m.month))
			.map((m) => ({ month: m.month as string, items: list(m.items).filter(isShipped) }))
			.filter((m) => m.items.length > 0),
	};
}
