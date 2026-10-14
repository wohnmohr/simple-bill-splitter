/**
 * The public roadmap at /roadmap. Edit freely: move an item from NEXT to
 * SHIPPED when it lands. Keep the request form's "Which of these…"
 * checkboxes in Tally (form REQUEST_FORM_ID) in step with NEXT and LATER.
 */

export type RoadmapIcon = "repeat" | "list" | "scan" | "globe" | "download" | "languages";

export type PlannedItem = { title: string; body: string; icon: RoadmapIcon };
export type ShippedItem = { title: string; href: string };

/** Being designed or built now. */
export const NEXT: PlannedItem[] = [
	{
		icon: "repeat",
		title: "Recurring expenses",
		body: "Rent, Wi-Fi and subscriptions that come round every month, added to the group for you.",
	},
	{
		icon: "list",
		title: "Split a bill by item",
		body: "Everyone ticks what they had, and tax and service charge are shared out in proportion.",
	},
	{
		icon: "scan",
		title: "Scan a bill",
		body: "Take a photo of the bill and SplitBiller fills in the total and the items.",
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
		icon: "download",
		title: "Export a group",
		body: "Download every expense and settlement as a spreadsheet or a PDF.",
	},
	{
		icon: "languages",
		title: "Hindi and more Indian languages",
		body: "SplitBiller in the language your group actually talks in.",
	},
];

/** Most recent first. */
export const SHIPPED: { month: string; items: ShippedItem[] }[] = [
	{
		month: "October 2026",
		items: [
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
