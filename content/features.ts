import { CURRENCIES } from "@/constants";
import { ALL_TOOL_SLUGS } from "@/content/tools";
import { TEMPLATES } from "@/utils/payStory";
import { SPLIT_TTL_DAYS } from "@/utils/splitCloud";
import { THEMES } from "@/utils/themes";

/**
 * Everything on /features. Each feature has a short looping screen recording
 * in public/features/<clip>.mp4 (plus a .webp poster); wide clips show two
 * phones side by side.
 */
export type Feature = {
	id: string;
	eyebrow: string;
	title: string;
	body: string;
	points: string[];
	clip: { name: string; width: number; height: number; label: string; caption?: [string, string] };
	cta: { href: string; label: string };
};

const PHONE = { width: 540, height: 1052 };
const TWO_PHONES = { width: 1082, height: 1052 };
const symbols = CURRENCIES.map((c) => c.symbol).join(" ");
const darkThemes = THEMES.filter((t) => t.dark).length;

export const FEATURES: Feature[] = [
	{
		id: "groups",
		eyebrow: "Start",
		title: "A group in ten seconds. No signup.",
		body: "Name it, add who's in, and you're splitting. No account and no app to install. Your groups live on your device, not on our server.",
		points: [`Any of ${symbols}, rupees by default`, "Add UPI IDs now or when it's time to pay", "Undo for every delete"],
		clip: { name: "create-group", ...PHONE, label: "Creating a group called Goa trip and adding Asha, Ben and Chen" },
		cta: { href: "/dashboard", label: "Start a group" },
	},
	{
		id: "expenses",
		eyebrow: "Track",
		title: "Split equally, by percentage, exact amounts or shares",
		body: "Log what it was, who paid and who shared it. Split evenly, set percentages or exact amounts when orders differ, or give shares (2:1:1) when someone has the bigger room. SplitBiller checks they add up.",
		points: ["Pick exactly who shared each expense", "Edit or delete anything later", "A running total for the group"],
		clip: { name: "expenses", ...PHONE, label: "Adding a hotel bill split equally, then a dinner split 50/25/25" },
		cta: { href: "/dashboard", label: "Add your first expense" },
	},
	{
		id: "settle",
		eyebrow: "Settle",
		title: "Settle up in the fewest payments",
		body: "Balances show who's up and who's down. Settle up turns them into the smallest set of payments, so four friends don't need a dozen transfers.",
		points: ["Debts simplified automatically", "Tell it who you are and see just what you owe", "Mark payments paid as they happen"],
		clip: { name: "settle", ...PHONE, label: "Balances for four people, then three payments that settle the group" },
		cta: { href: "/dashboard", label: "Try it on your group" },
	},
	{
		id: "upi",
		eyebrow: "Pay",
		title: "Pay by UPI in one tap",
		body: "Tap Pay and your UPI app opens with the amount and UPI ID already filled in. On a computer, scan the QR code instead. Come back and mark it paid.",
		points: ["GPay, PhonePe, Paytm or any UPI app", "QR code when you're on a laptop", "WhatsApp reminders for whoever owes you"],
		clip: { name: "upi", ...PHONE, label: "Dev pays Asha ₹2,300 by UPI and marks it paid" },
		cta: { href: "/upi-bill-splitter", label: "Split a bill in ₹" },
	},
	{
		id: "share",
		eyebrow: "Share",
		title: "One link with the whole summary",
		body: "Send the group who pays whom, the balances and every expense in one link. It's encrypted in your browser and the data travels inside the link, so nothing is uploaded.",
		points: ["Send by WhatsApp, the share sheet or a copied link", "Friends can pay by UPI right from it", "They can open it in SplitBiller to keep a copy"],
		clip: { name: "share", ...PHONE, label: "Copying the settle-up link and opening it as a friend would" },
		cta: { href: "/dashboard", label: "Share your group" },
	},
	{
		id: "sync",
		eyebrow: "Together",
		title: "Shared groups, end-to-end encrypted",
		body: "Turn on sync and everyone with the link can add expenses from their own phone. Everything is encrypted on your device; our server only relays data it can't read.",
		points: [
			"Five-emoji safety code to check you're in the same group",
			"Optional passphrase, so a leaked link opens nothing",
			"Keeps working offline and syncs when you're back",
			"Deleted from our server after 6 months without changes",
		],
		clip: { name: "sync", ...TWO_PHONES, caption: ["Your phone", "Ben's phone"], label: "Turning on sync on one phone, opening the link on another, and an expense added there appearing on the first" },
		cta: { href: "/dashboard", label: "Share a group" },
	},
	{
		id: "join",
		eyebrow: "Join",
		title: "Join without giving your name",
		body: "Open a group's link and you're asked who you are. Keep a made-up name like “Mikoox”, pick yours from the list, or just look. Change it any time.",
		points: [
			"Tens of thousands of made-up names, never repeated in a group",
			"Give anyone a nickname that only your device shows",
			"Your personal link opens the group as you on your other devices",
		],
		clip: { name: "join", ...PHONE, label: "Opening a group link, shuffling made-up names and joining as Mikoox" },
		cta: { href: "/dashboard", label: "Start a group" },
	},
	{
		id: "themes",
		eyebrow: "Make it yours",
		title: "Give every group its own look",
		body: `${THEMES.length} themes, from classic Aubergine to the dark Midnight and Graphite. In a shared group, everyone sees the theme you pick.`,
		points: [`${THEMES.length - darkThemes} light and ${darkThemes} dark themes`, "Every theme checked for readable contrast", "The theme is encrypted with the group"],
		clip: { name: "themes", ...PHONE, label: "Switching a group to the Midnight, Terracotta and Ocean themes" },
		cta: { href: "/dashboard", label: "Pick a theme" },
	},
	{
		id: "split-links",
		eyebrow: "Collect",
		title: "Collect money with a single link",
		body: "Dinner, rent, a trip or a gift: pick a template, set the total and your UPI ID, and share one link. Friends pay you by UPI and everyone sees who's paid, live.",
		points: [
			`${TEMPLATES.length} templates, each with its own page`,
			"You or your friends can mark payments, whoever's first",
			`End-to-end encrypted and deleted after ${SPLIT_TTL_DAYS} days`,
		],
		clip: { name: "split-link", ...PHONE, label: "Creating a dinner split for six and marking Rahul and Aisha as paid" },
		cta: { href: "/split", label: "Create a split link" },
	},
	{
		id: "calculators",
		eyebrow: "Quick tools",
		title: `${ALL_TOOL_SLUGS.length} free calculators`,
		body: "Restaurant bills with tip, rent, electricity by usage, GST, UPI fees, Secret Santa and more. Each one gives you a result you can share.",
		points: ["No signup, works on any phone", "Share the result on WhatsApp", "Continue in SplitBiller when you need more"],
		clip: { name: "calculators", ...PHONE, label: "Splitting a ₹3,600 restaurant bill with a 10% tip among four friends" },
		cta: { href: "/tools", label: "See all tools" },
	},
];
