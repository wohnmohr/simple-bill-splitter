/**
 * The public roadmap at /roadmap. Edit freely: move an item from NEXT to
 * SHIPPED when it lands. Keep the request form's "Which of these…"
 * checkboxes in Tally (form REQUEST_FORM_ID) in step with NEXT and LATER.
 */

export type RoadmapIcon = "repeat" | "scan" | "globe" | "download" | "languages" | "type";

export type PlannedItem = { title: string; body: string; icon: RoadmapIcon };
export type ShippedItem = { title: string; href: string };

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
export const SHIPPED: { month: string; items: ShippedItem[] }[] = [
	{
		month: "October 2026",
		items: [
			{ title: "Alerts when someone adds an expense to a shared group, sent without revealing what changed", href: "/features#sync" },
			{ title: "Back up your groups, end-to-end encrypted, with a recovery link only you hold", href: "/dashboard" },
			{ title: "Type an expense like a message, read on your phone", href: "/" },
			{ title: "Friends tap what they ate from one link", href: "/split-swiggy-zomato-bill" },
			{ title: "Save any tool's result as a group", href: "/tools" },
			{ title: "More than one person can pay for an expense", href: "/features#expenses" },
			{ title: "Comment on an expense, encrypted like everything else", href: "/features#sync" },
			{ title: "Close a group when everyone is settled, and start the next one with the same people", href: "/features#groups" },
			{ title: "Suggestions for expenses you add often, and a warning for likely duplicates", href: "/features#expenses" },
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
