export type ToolSlug =
	| "restaurant-bill-splitter"
	| "trip-expense-splitter"
	| "split-bill-with-tax"
	| "split-bill-with-tip"
	| "split-bill-unequally"
	| "roommate-expense-splitter"
	| "split-rent-by-room-size"
	| "splitwise-alternative"
	| "upi-bill-splitter"
	| "upi-charges-above-2000"
	| "upi-mdr-calculator"
	| "upi-payment-split-planner"
	| "upi-qr-code-generator"
	| "road-trip-cost-splitter"
	| "group-contribution-collector"
	| "secret-santa-generator"
	| "split-electricity-bill"
	| "split-swiggy-zomato-bill"
	| "random-name-picker"
	| "random-team-generator"
	| "gst-calculator"
	| "discount-calculator";

export type CalculatorKind =
	| "restaurant"
	| "tip"
	| "tax"
	| "unequal"
	| "trip"
	| "roommate"
	| "upi"
	| "splitwise"
	| "upi-fee-customer"
	| "upi-fee-merchant"
	| "upi-split-planner"
	| "upi-qr"
	| "road-trip"
	| "contribution"
	| "secret-santa"
	| "name-picker"
	| "team-generator"
	| "gst"
	| "discount"
	| "order";

export type ToolFaq = { q: string; a: string };

/** A longer explainer section under the intro: paragraphs, then an optional table. */
export type ToolGuideSection = { heading: string; body: string[]; table?: { head: string[]; rows: string[][] } };

export type ToolPageConfig = {
	slug: ToolSlug;
	calculator: CalculatorKind;
	title: string;
	metaTitle: string;
	metaDescription: string;
	headline: string;
	subhead: string;
	intro: string[];
	howTo: { title: string; body: string }[];
	guide?: ToolGuideSection[];
	faqs: ToolFaq[];
	related: ToolSlug[];
	ctaLabel: string;
	/** schema.org applicationCategory for structured data; defaults to FinanceApplication. */
	schemaCategory?: "FinanceApplication" | "UtilitiesApplication" | "TravelApplication" | "LifestyleApplication";
	/** Shown under the headline on pages whose facts can change, e.g. "October 2026". */
	updated?: string;
	/** Replaces the default "share links encrypt…" line under the headline. */
	privacyNote?: string;
	/** Replaces the default "Need more than a quick calc?" block. */
	cta?: { heading: string; body: string };
};

export const TOOL_PAGES: Record<ToolSlug, ToolPageConfig> = {
	"restaurant-bill-splitter": {
		slug: "restaurant-bill-splitter",
		calculator: "restaurant",
		title: "Restaurant Bill Splitter",
		metaTitle: "Split a Restaurant Bill in ₹ — Service Charge, Tip, Pay by UPI",
		metaDescription:
			"Split a dinner bill with friends, service charge or tip included, and see each share in rupees. Everyone pays you back by UPI from one link. Free, no signup.",
		headline: "Split the restaurant bill in seconds",
		subhead:
			"Add the bill, tip or service charge, and how many people — get who owes what instantly.",
		intro: [
			"Dinner with friends shouldn’t end in a spreadsheet. Enter the total, add tip or service charge, choose equal or custom shares, and see the settlement.",
			"When you’re done, share an encrypted link so everyone sees the same numbers — nothing is stored on our servers.",
		],
		howTo: [
			{
				title: "Enter the bill total",
				body: "Use the pre-tax or final amount shown on the check — whichever your group agrees on.",
			},
			{
				title: "Add tip or service charge",
				body: "Use a percentage (e.g. 10% tip, 5% service) or a fixed amount. Both are included before splitting.",
			},
			{
				title: "Split & share",
				body: "See each person’s share, then share the settlement so friends can open it on SplitBiller.",
			},
		],
		faqs: [
			{
				q: "Does this include tax?",
				a: "You can enter a post-tax total, or use our tax splitter if you need tax calculated separately.",
			},
			{
				q: "Can one person pay and others reimburse?",
				a: "Yes. Mark who paid the bill, then share the settlement so others know exactly what to send.",
			},
			{
				q: "Is my bill data stored?",
				a: "No. Calculations run in your browser. Share links encrypt the split in the URL so our servers never see it.",
			},
		],
		related: [
			"split-bill-with-tip",
			"split-bill-with-tax",
			"upi-bill-splitter",
			"split-swiggy-zomato-bill",
			"group-contribution-collector",
		],
		ctaLabel: "Open full SplitBiller",
	},
	"trip-expense-splitter": {
		slug: "trip-expense-splitter",
		calculator: "trip",
		title: "Trip Expense Splitter",
		metaTitle: "Trip Expense Splitter — Split Travel Costs Fairly, Settle by UPI",
		metaDescription:
			"Split trip expenses with friends — stays, food, cabs, activities — and settle in the fewest UPI payments. Worked Goa trip example, no signup.",
		headline: "Split trip expenses without the spreadsheet",
		subhead:
			"Log stays, meals and rides as they happen. See who is owed what, then settle in as few payments as possible.",
		intro: [
			"Group trips accumulate uneven spending — one person books the stay, another covers cabs, someone else pays for dinner. This tool totals everything and settles with the fewest payments.",
			"Start with the quick calculator here, then open the full app to track the whole trip together with your friends.",
		],
		howTo: [
			{
				title: "Add each trip expense",
				body: "Name it (villa, scooters, dinner), enter the amount, and who paid.",
			},
			{
				title: "Include everyone on the trip",
				body: "Expenses are split among the people you list — skip anyone who sat that one out by editing in the full app.",
			},
			{
				title: "Settle at the end",
				body: "Share one encrypted link so the whole group sees the final who-owes-whom, and pay by UPI.",
			},
		],
		guide: [
			{
				heading: "A Goa trip, settled in three payments",
				body: [
					"Four friends spend ₹36,000 over a long weekend, so each person’s share is ₹9,000. Priya booked the villa, Rohan rented the scooters, Aisha paid for the dinners and Dev covered fuel and parking.",
				],
				table: {
					head: ["Person", "Paid", "Balance"],
					rows: [
						["Priya", "₹24,000", "Gets back ₹15,000"],
						["Rohan", "₹4,800", "Owes ₹4,200"],
						["Aisha", "₹6,000", "Owes ₹3,000"],
						["Dev", "₹1,200", "Owes ₹7,800"],
					],
				},
			},
			{
				heading: "Fewest payments, not the most",
				body: [
					"Settling every expense one by one could take nine or ten transfers. Netting the balances first needs just three: Dev sends Priya ₹7,800, Rohan sends ₹4,200 and Aisha sends ₹3,000. Each is a free person-to-person UPI transfer, and SplitBiller opens the payer’s UPI app with the amount filled in.",
				],
			},
			{
				heading: "Habits that keep a trip fair",
				body: [
					"Collect an advance before you book, so one person isn’t out of pocket for weeks; a split link collects it by UPI and shows who has paid. Log expenses the same day, while everyone remembers. Leave people out of the expenses they skipped, like the friend who didn’t go parasailing. Pick one currency for the whole trip.",
					"In the SplitBiller app, share the trip group so everyone can add expenses from their own phone. When the trip is over, settle up, close it, and start the next one with the same people in one tap.",
				],
			},
		],
		faqs: [
			{
				q: "Can I mix currencies?",
				a: "Pick one currency for the trip and convert rough amounts before entering, to keep settlements simple.",
			},
			{
				q: "What if not everyone shared every expense?",
				a: "In the full SplitBiller app, choose who shared each expense; the rest aren’t charged for it.",
			},
			{
				q: "What if two people paid for one thing?",
				a: "The app supports several payers on one expense, for example when two friends split the villa deposit between their cards.",
			},
			{
				q: "Does everyone need the app?",
				a: "No. Friends open the shared link in their phone browser, tap their name and see what they owe. No download or signup.",
			},
		],
		related: [
			"road-trip-cost-splitter",
			"split-bill-unequally",
			"splitwise-alternative",
			"group-contribution-collector",
		],
		ctaLabel: "Track the whole trip in SplitBiller",
	},
	"split-bill-with-tax": {
		slug: "split-bill-with-tax",
		calculator: "tax",
		title: "Split Bill with Tax",
		metaTitle: "Split a Bill with GST or Tax — Each Share in ₹, Free",
		metaDescription:
			"Work out each person’s share of a bill with GST or any tax rate included. Instant amounts in rupees and one link where everyone pays you back by UPI. Free, no signup.",
		headline: "Split a bill with tax included",
		subhead:
			"Enter the pre-tax amount and tax rate — or the final total — and split fairly among your group.",
		intro: [
			"Tax makes mental math messy. This calculator applies the tax rate, then divides the grand total so nobody underpays.",
			"Works for GST, VAT, sales tax, or any percentage added to a subtotal.",
		],
		howTo: [
			{
				title: "Enter subtotal and tax %",
				body: "Or skip the rate and paste the final tax-inclusive total directly.",
			},
			{
				title: "Choose headcount",
				body: "Equal split by default — switch to unequal shares if needed.",
			},
			{
				title: "Share the result",
				body: "Send an encrypted settlement link so everyone confirms the same numbers.",
			},
		],
		faqs: [
			{
				q: "What if some items are tax-exempt?",
				a: "Split taxable and non-taxable portions as separate expenses in the full app for accuracy.",
			},
			{
				q: "Does this work with GST?",
				a: "Yes — enter your GST/VAT rate the same way as any other tax percentage.",
			},
		],
		related: [
			"split-bill-with-tip",
			"restaurant-bill-splitter",
			"split-bill-unequally",
		],
		ctaLabel: "Continue in SplitBiller",
	},
	"split-bill-with-tip": {
		slug: "split-bill-with-tip",
		calculator: "tip",
		title: "Split Bill with Tip",
		metaTitle: "Split Bill with Tip — Add Tip %, Divide, Collect by UPI",
		metaDescription:
			"Add a tip percentage to the bill and split it among friends. Per-person totals in rupees and one private link where everyone pays you back by UPI. Free, no signup.",
		headline: "Add the tip, then split the bill",
		subhead:
			"Choose 10%, 15%, 18%, 20%, or a custom tip — see each person’s share including gratuity.",
		intro: [
			"Tipping before splitting avoids the classic under-tip when everyone rounds down. This tool adds tip first, then divides cleanly.",
			"Perfect for restaurants, delivery, and group dining where one person pays the card.",
		],
		howTo: [
			{
				title: "Enter the bill before tip",
				body: "Usually the pre-tip total on the check or receipt.",
			},
			{
				title: "Pick a tip percentage",
				body: "Use quick presets or type an exact tip amount.",
			},
			{
				title: "Split among diners",
				body: "Get per-person totals and share the settlement privately.",
			},
		],
		faqs: [
			{
				q: "Should tip be on pre-tax or post-tax?",
				a: "Local custom varies. Enter whichever base your group prefers — the calculator doesn’t judge.",
			},
			{
				q: "Can I tip a fixed amount instead of %?",
				a: "Yes — switch to a fixed tip amount in the calculator.",
			},
		],
		related: [
			"restaurant-bill-splitter",
			"split-bill-with-tax",
			"upi-bill-splitter",
		],
		ctaLabel: "Open SplitBiller",
	},
	"split-bill-unequally": {
		slug: "split-bill-unequally",
		calculator: "unequal",
		title: "Split Bill Unequally",
		metaTitle: "Split a Bill Unequally — By Amount or %, Settle by UPI",
		metaDescription:
			"Split a bill unevenly by exact amounts or percentages when people ordered different things. See who owes whom in rupees and settle up by UPI. Free, no signup.",
		headline: "Split unevenly — by amount or percent",
		subhead:
			"Someone ordered steak, someone had water. Assign exact shares without awkward debates.",
		intro: [
			"Equal splits fail when orders differ. Assign each person a dollar/rupee amount or a percentage of the total.",
			"The calculator validates that shares add up, then builds a settlement you can share.",
		],
		howTo: [
			{
				title: "Add people and the total",
				body: "List everyone in the split and the bill total (with tip/tax if already included).",
			},
			{
				title: "Assign shares",
				body: "Use exact amounts or percentages. We’ll warn you if they don’t add up.",
			},
			{
				title: "Settle who pays whom",
				body: "Mark who paid the bill, then share the encrypted result.",
			},
		],
		faqs: [
			{
				q: "Can I mix equal and unequal expenses?",
				a: "Yes in the full SplitBiller app — each expense can use equal or percentage split.",
			},
			{
				q: "What if percentages don’t sum to 100?",
				a: "We’ll normalize them proportionally, or you can fix them until they total 100%.",
			},
		],
		related: [
			"restaurant-bill-splitter",
			"roommate-expense-splitter",
			"trip-expense-splitter",
		],
		ctaLabel: "Use full unequal splits in SplitBiller",
	},
	"roommate-expense-splitter": {
		slug: "roommate-expense-splitter",
		calculator: "roommate",
		title: "Roommate Expense Splitter",
		metaTitle: "Roommate Expense Splitter India — Rent, Bills, Settle by UPI",
		metaDescription:
			"Split rent, electricity, groceries and other flat bills among roommates in rupees. See who owes whom and settle up by UPI. No app to install, no signup.",
		headline: "Split roommate expenses fairly",
		subhead:
			"Rent, Wi‑Fi, electricity, groceries — log shared costs and settle with minimal transfers.",
		intro: [
			"Roommate finances are recurring and uneven. One person pays the landlord, another covers Wi‑Fi, groceries rotate. This calculator settles the month without a shared spreadsheet.",
			"No roommate has to create an account — share an encrypted link when it’s time to settle.",
		],
		howTo: [
			{
				title: "List roommates",
				body: "Add everyone who shares the apartment or house.",
			},
			{
				title: "Add this month’s bills",
				body: "Rent, utilities, internet, cleaning supplies — who paid each one.",
			},
			{
				title: "Settle up",
				body: "Share one link so everyone can pay their portion.",
			},
		],
		faqs: [
			{
				q: "Can rent be split unequally by room size?",
				a: "Yes — use percentage or custom amounts for rent, and equal split for shared groceries. The rent by room size calculator shows how to work out fair percentages.",
			},
			{
				q: "Do we need an ongoing account?",
				a: "No. Keep using the browser tool; data stays on each device unless you share a link.",
			},
		],
		related: [
			"split-rent-by-room-size",
			"split-electricity-bill",
			"split-bill-unequally",
			"splitwise-alternative",
		],
		ctaLabel: "Manage monthly splits in SplitBiller",
	},
	"split-rent-by-room-size": {
		slug: "split-rent-by-room-size",
		calculator: "unequal",
		title: "Split Rent by Room Size",
		metaTitle: "Split Rent by Room Size — Fair Rent Calculator for Flatmates",
		metaDescription:
			"Work out a fair rent split when rooms differ in size: common area shared equally, bedrooms by square feet, extra for an attached bathroom or balcony. Worked ₹ example, free.",
		headline: "Split the rent fairly when rooms differ",
		subhead:
			"Share the common area equally and the bedrooms by size, then settle each month by UPI.",
		intro: [
			"Splitting rent equally works when the rooms are alike. When one flatmate has the master bedroom with an attached bathroom and another has the small room by the kitchen, an equal split quietly overcharges the small room.",
			"The fairest common method: everyone shares the living room, kitchen and passages equally, and pays for their own bedroom by its size. Work the percentages out below, enter them in the calculator, and everyone sees the same numbers.",
		],
		howTo: [
			{
				title: "Measure the rooms",
				body: "Note each bedroom’s area in square feet, and the flat’s total from the rent agreement.",
			},
			{
				title: "Enter each share",
				body: "Switch the calculator to percentage and enter each person’s share of the rent.",
			},
			{
				title: "Settle every month",
				body: "Mark who pays the landlord, and everyone else sends their share by UPI.",
			},
		],
		guide: [
			{
				heading: "A worked example",
				body: [
					"Three flatmates rent a 1,200 sq ft flat for ₹45,000 a month. The bedrooms are 200 sq ft (with attached bathroom), 150 and 150 sq ft, so 500 sq ft is private and 700 sq ft is shared.",
					"The shared 700 sq ft is 58.3% of the flat, or ₹26,250 of the rent, split equally at ₹8,750 each. The private 500 sq ft is the other ₹18,750, split by bedroom size: ₹7,500, ₹5,625 and ₹5,625. Add the two parts for each person:",
				],
				table: {
					head: ["Flatmate", "Bedroom", "Pays", "Share"],
					rows: [
						["Asha", "200 sq ft", "₹16,250", "36.1%"],
						["Ben", "150 sq ft", "₹14,375", "31.9%"],
						["Chitra", "150 sq ft", "₹14,375", "31.9%"],
					],
				},
			},
			{
				heading: "Adjusting for bathrooms, balconies and ACs",
				body: [
					"Square feet don’t capture everything. Many flats add a fixed premium for an attached bathroom, a balcony or a room AC, for example ₹1,000 a month, taken off the other rooms equally. Agree the premiums before you move in, and write the final percentages in your group chat so nobody re-argues them later.",
					"Split the deposit and brokerage in the same proportions as the rent, so whoever has the bigger room puts in the bigger share and gets it back when you move out.",
				],
			},
			{
				heading: "Make it automatic",
				body: [
					"In the SplitBiller app, make a group for the flat and add the rent as a monthly repeating expense with these shares. Add electricity, Wi-Fi and groceries as they come, and at the end of the month everyone settles up in as few UPI payments as possible.",
				],
			},
		],
		faqs: [
			{
				q: "Is splitting rent by room size fair?",
				a: "It’s the most common fair method when rooms differ. Shared spaces are split equally because everyone uses them; bedrooms are split by size because only one person uses each.",
			},
			{
				q: "Can I enter square feet instead of percentages?",
				a: "Yes. The percentage mode scales whatever numbers you enter to 100%, so the shares from the example (36.1, 31.9, 31.9) or the final rupee amounts both work.",
			},
			{
				q: "How much extra for an attached bathroom?",
				a: "There’s no standard. A fixed ₹500 to ₹1,500 a month, or treating the bathroom’s area as part of that bedroom, are both common. What matters is that everyone agrees before moving in.",
			},
			{
				q: "Should a couple sharing one room pay double?",
				a: "Usually they pay one bedroom share plus two shares of the common area, since two people use the kitchen and living room.",
			},
		],
		related: ["roommate-expense-splitter", "split-electricity-bill", "split-bill-unequally", "splitwise-alternative"],
		schemaCategory: "LifestyleApplication",
		ctaLabel: "Manage monthly rent in SplitBiller",
	},
	"splitwise-alternative": {
		slug: "splitwise-alternative",
		calculator: "splitwise",
		title: "Splitwise Alternative",
		metaTitle: "Splitwise Alternative in India — Free, No Signup, No Daily Limit",
		metaDescription:
			"A free Splitwise alternative with no account, no daily expense limit and one-tap UPI settle up. Compare features, see when Splitwise is still the better pick, and move a group over in minutes.",
		headline: "A Splitwise alternative without the account",
		subhead:
			"Same job — who owes whom — without making friends sign up, download an app or wait out a daily limit.",
		intro: [
			"Splitwise is great for long-running groups. For one-off dinners, weekend trips, or friends who won’t install yet another app, the signup and the free plan’s daily expense limit kill momentum.",
			"SplitBiller works in any phone browser with no account. Groups stay on your phone, sharing is end-to-end encrypted, and everyone settles up in one tap on UPI. Try the quick split below, or open the app for a full group.",
		],
		howTo: [
			{
				title: "Skip the app install",
				body: "Works in any mobile or desktop browser. Add it to your home screen if you want an app icon.",
			},
			{
				title: "Split any way",
				body: "Equally, by exact amounts, by percentage or by shares, with one or several people paying.",
			},
			{
				title: "Share privately",
				body: "Friends open an encrypted link, tap their name and see what they owe. No invites, no logins.",
			},
		],
		guide: [
			{
				heading: "SplitBiller and Splitwise compared",
				body: [
					"Both answer the same question: who owes whom, settled in as few payments as possible. They differ in what they ask of your friends.",
				],
				table: {
					head: ["", "SplitBiller", "Splitwise (free plan)"],
					rows: [
						["Account needed", "No, for anyone", "Yes, for everyone in the group"],
						["Expenses per day", "No limit", "Limited; reported as 3 to 4 a day since December 2023"],
						["Price", "Free", "Free with limits; Pro reported at ₹149 a month or ₹999 a year"],
						["Receipt scanning", "Free, read on your phone", "Pro only"],
						["Where data lives", "On your phone; shared groups end-to-end encrypted", "In your Splitwise account"],
					],
				},
			},
			{
				heading: "When Splitwise is still the better choice",
				body: [
					"If your group already lives in Splitwise, has years of history, and everyone is happy with an account, there’s little reason to move. Splitwise also gives each person one balance across all their groups, tied to their login on every device.",
					"SplitBiller is the better fit when some friends won’t sign up, when you hit the daily limit on a trip, or when you’d rather your spending not sit in anyone’s cloud account.",
				],
			},
			{
				heading: "Move a group over in five minutes",
				body: [
					"Open SplitBiller, create the group and paste everyone’s names at once. For each open balance in Splitwise, add one expense: paid by the person who is owed, split to the person who owes, for the exact amount. The balances then match.",
					"Tap Share, send the link to your group chat, and each friend taps their own name. From then on anyone in the group can add expenses, and everyone sees the same numbers.",
				],
			},
		],
		faqs: [
			{
				q: "How is this different from Splitwise?",
				a: "No accounts, no daily limit, and no cloud ledger of your spending. You share an encrypted link instead of inviting people to a platform, and settle with UPI in one tap.",
			},
			{
				q: "Is it really free without signup?",
				a: "Yes. Every feature, including scanning a receipt, is free and needs no email or phone number.",
			},
			{
				q: "Can it replace Splitwise for roommates?",
				a: "For most flats, yes. Add rent as a monthly repeating expense, split the bills by usage or room size, and settle at the end of the month.",
			},
			{
				q: "What happens if I clear my browser data?",
				a: "Groups you haven’t shared live only in that browser. Turn on “Keep your groups safe” for an encrypted backup you can restore with a recovery link. Shared groups can be opened again from the group link.",
			},
			{
				q: "Is there a mobile app?",
				a: "No download needed. Open splitbiller.com on your phone and add it to your home screen for an app-like icon.",
			},
		],
		related: [
			"roommate-expense-splitter",
			"trip-expense-splitter",
			"split-rent-by-room-size",
			"upi-bill-splitter",
		],
		updated: "October 2026",
		ctaLabel: "Try SplitBiller free",
	},
	"upi-bill-splitter": {
		slug: "upi-bill-splitter",
		calculator: "upi",
		title: "UPI Bill Splitter",
		metaTitle: "UPI Bill Splitter — Split in ₹, Friends Pay You in One Tap",
		metaDescription:
			"Split any bill in rupees and send one link: each friend taps Pay and their UPI app opens with the amount filled in. Works with GPay, PhonePe and Paytm. Free, no signup.",
		headline: "Split the bill, pay with UPI",
		subhead:
			"Calculate who owes whom in ₹, then open a UPI intent with the exact amount — or share the settlement link.",
		intro: [
			"In India, settling usually means UPI. This tool splits the bill in rupees and can build upi:// payment links with the payee VPA and exact amount.",
			"Friends who can’t open UPI intents still get a clear settlement via the encrypted share link.",
		],
		howTo: [
			{
				title: "Split in ₹",
				body: "Enter the bill, people, and who paid — amounts stay in Indian Rupees.",
			},
			{
				title: "Add UPI IDs (optional)",
				body: "For each person who should receive money, add their VPA (e.g. name@upi).",
			},
			{
				title: "Pay or share",
				body: "Tap Pay via UPI on each settlement, or share one link with the whole group.",
			},
		],
		faqs: [
			{
				q: "Do you process UPI payments?",
				a: "No. We only generate standard upi:// links that open your installed UPI app (GPay, PhonePe, Paytm, etc.).",
			},
			{
				q: "Is the UPI ID uploaded anywhere?",
				a: "No. It stays in your browser session for generating links. Encrypted shares include names and amounts, not UPI IDs unless you put them in names.",
			},
		],
		related: [
			"restaurant-bill-splitter",
			"roommate-expense-splitter",
			"upi-charges-above-2000",
			"upi-qr-code-generator",
		],
		ctaLabel: "Open SplitBiller (₹)",
	},
	"upi-charges-above-2000": {
		slug: "upi-charges-above-2000",
		calculator: "upi-fee-customer",
		title: "UPI Charges Above ₹2,000",
		metaTitle: "UPI Charges Above ₹2,000 — Do You Pay? (15 Oct 2026 MDR Explained)",
		metaDescription:
			"From 15 Oct 2026 a 0.4% MDR applies to some merchant UPI payments above ₹2,000 — charged to the merchant, not you. See who pays what with examples, and split bills with friends free.",
		headline: "Do you pay UPI charges above ₹2,000?",
		subhead:
			"Short answer: no. The new fee is charged to merchants — you still pay only the listed price.",
		intro: [
			"From 15 October 2026, NPCI’s merchant discount rate (MDR) framework applies a 0.4% fee, capped at ₹300, to certain person-to-merchant (P2M) UPI payments above ₹2,000. The fee sits on the merchant’s side, so as a customer you still pay only the price shown.",
			"Paying friends is unaffected. Person-to-person (P2P) UPI transfers stay free at any amount — including splitting a dinner or trip bill by sending your share to whoever paid. Use the checker below to see who bears what, then split your next bill free.",
		],
		howTo: [
			{
				title: "Pick who you’re paying",
				body: "A friend or family member (P2P) or a shop or business (P2M). The fee only ever applies to the second case.",
			},
			{
				title: "Enter the amount",
				body: "Payments up to ₹2,000 are free either way. Above that, see roughly what the merchant’s side may pay.",
			},
			{
				title: "Split the bill the free way",
				body: "For group bills, one person pays the merchant and everyone else sends them their share by UPI — a free P2P transfer.",
			},
		],
		guide: [
			{
				heading: "Who pays what, with examples",
				body: [
					"In every case below, you pay the listed price and nothing more. The fee column is what the merchant’s side bears, as reported for the framework.",
				],
				table: {
					head: ["Payment", "Fee", "Who pays it"],
					rows: [
						["₹5,000 to a friend (P2P)", "₹0", "Nobody"],
						["₹1,500 at a shop", "₹0", "Nobody: ₹2,000 or less is free"],
						["₹5,000 at a restaurant", "₹20 (0.4%)", "The restaurant"],
						["₹50,000 at an electronics store", "₹200 (0.4%)", "The store"],
						["₹1,00,000 at a jeweller", "₹300 (the cap)", "The jeweller"],
						["₹5,000 for fuel, insurance, railways or telecom", "₹5 flat", "The merchant"],
						["₹5,000 at a small shop taking up to ₹1 lakh a month by UPI", "₹0", "Nobody: small merchants are exempt"],
					],
				},
			},
			{
				heading: "If a shop asks you to pay extra",
				body: [
					"The framework is reported as a merchant-side cost that isn’t meant to be added to your bill, and UPI stays free for consumers. If a shop adds a “UPI charge” on top of the listed price, you can ask them to remove it, pay another way, or raise it through the help section of your UPI app or bank.",
				],
			},
			{
				heading: "How to split a big bill with no fees at all",
				body: [
					"Say four friends eat out and the bill is ₹8,000. One person pays the restaurant: they pay ₹8,000, and the restaurant bears its own fee. The other three each send ₹2,000 to that person by UPI. Those are P2P transfers, so they are free at any amount.",
					"SplitBiller does the maths for you, even when people ordered different things or several people paid, and opens each friend’s UPI app with their exact share filled in.",
				],
			},
		],
		faqs: [
			{
				q: "Will I be charged extra for UPI payments above ₹2,000?",
				a: "No. The MDR is a merchant-side fee. You should pay only the listed price, and UPI remains free for consumers.",
			},
			{
				q: "Does it apply when I send money to a friend?",
				a: "No. Person-to-person UPI transfers are free at any amount, so settling a split bill with friends costs nothing.",
			},
			{
				q: "Which merchants pay, and how much?",
				a: "As reported: 0.4% of the payment (capped at ₹300) for most merchants; a flat ₹5 for railways, telecom, insurance, fuel, utilities and agri inputs; and 0.02% (capped at ₹300) for capital-markets payments. Merchants receiving up to ₹1 lakh a month over UPI pay nothing.",
			},
			{
				q: "At what amount does the ₹300 cap kick in?",
				a: "At ₹75,000, because 0.4% of ₹75,000 is ₹300. Above that, the fee stays at ₹300 however large the payment.",
			},
			{
				q: "What about payments up to ₹2,000?",
				a: "They stay free for both the customer and the merchant.",
			},
			{
				q: "Is this the same as the 2023 wallet fee?",
				a: "No. In April 2023 NPCI introduced a 1.1% interchange fee on UPI payments above ₹2,000 made through prepaid wallets (PPIs). That was also paid on the merchant side, not by customers. The October 2026 MDR framework is separate.",
			},
			{
				q: "When does it start, and could it change?",
				a: "15 October 2026. Rules like this can be revised, so confirm the latest on npci.org.in or with your bank. This page is for general information, not financial advice.",
			},
		],
		related: ["upi-mdr-calculator", "upi-payment-split-planner", "upi-bill-splitter", "restaurant-bill-splitter"],
		updated: "October 2026",
		ctaLabel: "Split a bill & settle via UPI",
	},
	"upi-mdr-calculator": {
		slug: "upi-mdr-calculator",
		calculator: "upi-fee-merchant",
		title: "UPI MDR Calculator",
		metaTitle: "UPI MDR Calculator — Fee on Payments Above ₹2,000 (0.4%, ₹300 cap)",
		metaDescription:
			"Calculate the UPI MDR on a merchant payment above ₹2,000: 0.4% capped at ₹300, flat ₹5 for essential sectors, ₹1 lakh/month exemption. Free, instant, no signup.",
		headline: "UPI MDR calculator for merchants",
		subhead:
			"See the fee on a UPI payment above ₹2,000, what you receive, and your monthly cost.",
		intro: [
			"NPCI’s MDR framework, effective 15 October 2026, charges merchants a fee on certain UPI payments above ₹2,000. For most merchants it is 0.4% of the payment, capped at ₹300 — the cap is reached at a ₹75,000 payment.",
			"Enter an amount, choose your merchant type, and see the fee per payment, the effective rate, what lands in your account, and what it adds up to over a month. Small merchants receiving up to ₹1 lakh a month over UPI are exempt.",
		],
		howTo: [
			{
				title: "Enter the payment amount",
				body: "Fees apply only above ₹2,000. At or below that, the result is ₹0.",
			},
			{
				title: "Choose your merchant type",
				body: "Most merchants pay 0.4% (max ₹300). Railways, telecom, insurance, fuel, utilities and agri inputs pay a flat ₹5. Capital-markets payments pay 0.02% (max ₹300).",
			},
			{
				title: "Check the monthly impact",
				body: "Enter how many payments like this you get per month to see the total cost.",
			},
		],
		faqs: [
			{
				q: "How is the UPI MDR calculated?",
				a: "For most merchants: payment × 0.4%, up to a maximum of ₹300. For example ₹5,000 → ₹20; ₹50,000 → ₹200; ₹75,000 or more → ₹300.",
			},
			{
				q: "Who is exempt?",
				a: "As reported, merchants receiving up to ₹1 lakh a month over UPI pay no MDR, and so do payments up to ₹2,000 and all person-to-person transfers. UPI AutoPay mandates are also reported as exempt.",
			},
			{
				q: "Can I pass the MDR on to customers?",
				a: "Reports on the framework say it is not meant to be passed on to customers as an extra charge. Check your payment provider’s terms and price the cost in instead.",
			},
			{
				q: "Does the result include GST?",
				a: "No. It shows the MDR only. Any GST on the fee and any payment-provider charges are separate — check with your bank or provider.",
			},
			{
				q: "Is this official?",
				a: "It is an independent calculator based on the publicly reported NPCI framework. Rules can be revised, so confirm with NPCI or your payment provider before relying on it.",
			},
		],
		related: ["upi-payment-split-planner", "upi-charges-above-2000", "upi-bill-splitter"],
		updated: "October 2026",
		ctaLabel: "Try the free bill splitter",
	},
	"split-electricity-bill": {
		slug: "split-electricity-bill",
		calculator: "unequal",
		title: "Split Electricity Bill",
		metaTitle: "Split Electricity Bill Between Roommates — Fair by Usage or Equal",
		metaDescription:
			"Split an electricity bill fairly between roommates or flatmates — equally, by sub-meter units, or by AC hours. Worked ₹ examples, instant shares and a UPI-ready settlement link.",
		headline: "Split the electricity bill fairly",
		subhead:
			"Equal, by usage, or by room — enter each person’s share and see who owes whom.",
		intro: [
			"An equal split is simplest, but it feels unfair when one room runs an AC all night. A common fair method: split the fixed charges equally and the energy charges by usage (sub-meter units or AC hours).",
			"Use the calculator to enter each person’s share as an amount or a percentage, mark who paid the bill, and get the exact amounts to send. Settle by UPI and share one link so everyone sees the same numbers.",
		],
		howTo: [
			{
				title: "Enter the bill total",
				body: "Use the amount on the electricity bill, or the amount you’re splitting after any common-area share.",
			},
			{
				title: "Assign each person’s share",
				body: "By amount (from sub-meter readings) or by percentage (for example, by AC hours or room size).",
			},
			{
				title: "Settle up",
				body: "Mark who paid the bill, then everyone sends their share. Share the link so nobody has to recalculate.",
			},
		],
		guide: [
			{
				heading: "Three fair ways to split it",
				body: [
					"Most Indian electricity bills have three parts: a fixed charge for the connection, energy charges for the units used, and electricity duty or taxes on top. The fixed charge doesn’t depend on who uses what, so it’s fair to split it equally. The energy charges are where usage matters.",
					"Here is one ₹3,600 bill for three flatmates, split three ways. Equal suits a flat where everyone uses about the same. Sub-meter units suit rooms with their own meters. With no meters but one heavy AC user, split half equally and half by AC hours.",
				],
				table: {
					head: ["Method", "Asha", "Ben", "Chitra"],
					rows: [
						["Equal", "₹1,200", "₹1,200", "₹1,200"],
						["Sub-meter units", "₹1,750", "₹925", "₹925"],
						["Half equal, half by AC hours", "₹1,800", "₹1,200", "₹600"],
					],
				},
			},
			{
				heading: "How the examples were worked out",
				body: [
					"Sub-meter units: the bill is ₹300 fixed charge plus ₹3,300 of energy and duty. Asha’s meter read 200 units, Ben’s and Chitra’s 100 each, so Asha pays half the ₹3,300 (₹1,650) and the others a quarter each (₹825). Add ₹100 each for the fixed charge.",
					"AC hours: with no meters, split half the bill (₹1,800) equally, ₹600 each. Split the other half by nightly AC hours: Asha 8, Ben 4, Chitra 0, so ₹1,200, ₹600 and ₹0. In the calculator’s percentage mode that’s 50%, 33.3% and 16.7%.",
				],
			},
			{
				heading: "Keep it simple every month",
				body: [
					"Agree the method once, then reuse the same percentages each month so nobody re-argues it. In the SplitBiller app, make a group for the flat and add the bill each month, alongside rent, Wi-Fi and groceries. At the end of the month everyone settles in as few UPI payments as possible.",
				],
			},
		],
		faqs: [
			{
				q: "What is the fairest way to split electricity between roommates?",
				a: "Split fixed charges equally and energy charges by usage — sub-meter units if you have them, otherwise AC or heater hours. If usage is similar, an equal split is fine.",
			},
			{
				q: "How do I split a bill when one person uses the AC more?",
				a: "Use the percentage mode: give the heavier user a larger percentage, for example 50/33/17, and the calculator works out the amounts.",
			},
			{
				q: "What if someone was away for part of the month?",
				a: "Split the fixed charge equally and the energy charge by days at home. Someone home for 15 of 30 days pays half a share of the energy charge.",
			},
			{
				q: "How do I split it every month?",
				a: "Reuse the same percentages each month. For rent, groceries and the bill together, use the roommate expense splitter or a SplitBiller group.",
			},
		],
		related: ["roommate-expense-splitter", "split-rent-by-room-size", "split-bill-unequally", "upi-bill-splitter"],
		updated: "October 2026",
		ctaLabel: "Track monthly bills in SplitBiller",
	},
	"split-swiggy-zomato-bill": {
		slug: "split-swiggy-zomato-bill",
		calculator: "order",
		title: "Split Swiggy / Zomato Bill",
		metaTitle: "Split a Swiggy or Zomato Order from a Screenshot — Delivery Fee, GST & Discounts",
		metaDescription:
			"Scan your Swiggy, Zomato or Instamart order screenshot, tap who had what, and get each person’s fair share with delivery fee, GST and discounts included. Read on your phone, free, no signup.",
		headline: "Split a Swiggy or Zomato order fairly",
		subhead:
			"Scan the order screenshot, tap who had what, and everyone’s share comes out right, with fees, GST and discounts shared fairly.",
		intro: [
			"Group food orders get messy: item prices, delivery fee, platform fee, GST and discounts all land on one person’s card. Splitting the total equally is unfair when one person ordered a biryani and another a lime soda.",
			"Scan a screenshot of the order summary and SplitBiller reads the items, fees, taxes and discount for you. The screenshot is read on your phone and never uploaded. Tap who had each item, and fees, GST and discounts are shared in proportion to what each person ordered. It works for Instamart, Blinkit and Zepto orders too. SplitBiller isn’t affiliated with Swiggy, Zomato or any of them.",
		],
		howTo: [
			{
				title: "Scan the order",
				body: "Take a screenshot of the order summary in the Swiggy or Zomato app and pick it here. Or type the items yourself.",
			},
			{
				title: "Tap who had what",
				body: "Every item starts as shared by everyone. Tap names to give an item to just those people.",
			},
			{
				title: "Share and settle",
				body: "Send the result in your group chat and everyone pays their exact share by UPI.",
			},
		],
		guide: [
			{
				heading: "Why an equal split is unfair on food orders",
				body: [
					"Take a ₹620 order for three. Asha had a ₹350 biryani, Ben a ₹200 paneer roll and Chitra a ₹50 lime soda. On top came ₹40 delivery, a ₹10 platform fee and ₹30 GST, minus a ₹60 coupon: ₹20 of extras in all.",
					"Split equally, everyone pays ₹206.67 and Chitra pays four times what she ordered. Split fairly, each person pays for their own items plus a share of the extras (fees, GST and coupon) in proportion to what they ordered.",
				],
				table: {
					head: ["Person", "Ordered", "Extras", "Pays"],
					rows: [
						["Asha", "₹350", "₹11.67", "₹361.67"],
						["Ben", "₹200", "₹6.67", "₹206.67"],
						["Chitra", "₹50", "₹1.66", "₹51.66"],
					],
				},
			},
			{
				heading: "Shared dishes, coupons and tips",
				body: [
					"A starter everyone shared is split between the people who had it; tap their names on that item. A coupon or Swiggy One discount lowers everyone’s share in proportion, so the person who ordered more saves more. Treat a delivery tip like a fee so it’s shared the same way, unless one person tipped on their own.",
					"Once the shares are worked out, the person who paid sends the result to the group chat and everyone pays their exact amount by UPI, free.",
				],
			},
		],
		faqs: [
			{
				q: "Is my screenshot uploaded anywhere?",
				a: "No. It’s read on your own phone or computer, and the image never leaves it. Only the text it finds fills in the form.",
			},
			{
				q: "How are the delivery fee, GST and discounts split?",
				a: "In proportion to what each person ordered. If you had a third of the food, you pay a third of the fees and taxes and get a third of the discount.",
			},
			{
				q: "What if it reads something wrong?",
				a: "Every item and amount can be edited, and a check shows whether everything adds up to what you paid, so a misread number stands out.",
			},
			{
				q: "Does it work for Instamart, Blinkit or Zepto?",
				a: "Instamart, yes. Blinkit and Zepto order summaries list items, prices and a total the same way, so they should work, but they've been tested less. Grocery orders split with flatmates work the same as food.",
			},
			{
				q: "What can't it read yet?",
				a: "Scanning is in beta. It reads app screenshots best. Photos of paper bills, especially creased or angled ones, often come out wrong, and the review screen warns you when the amounts don't add up. It reads English and one screenshot at a time, so an order that runs over two screenshots needs its items typed in. If the screenshot doesn't show the total, it can't check the amounts, so type the total in.",
			},
			{
				q: "How do friends pay me back?",
				a: "Share the result and have them send their share by UPI. Person-to-person UPI transfers are free.",
			},
		],
		related: ["restaurant-bill-splitter", "split-bill-unequally", "upi-bill-splitter"],
		updated: "October 2026",
		ctaLabel: "Open full SplitBiller",
	},
	"upi-payment-split-planner": {
		slug: "upi-payment-split-planner",
		calculator: "upi-split-planner",
		title: "UPI Payment Split Planner",
		metaTitle: "UPI Payment Split Planner — Keep Payments Under ₹2,000 & Save MDR",
		metaDescription:
			"Split up to ₹20,000 into UPI payments of ₹2,000 or less to avoid the 0.4% MDR. See the fee saved, whether it’s worth it, and tick off payments as they arrive.",
		headline: "Split a UPI payment into ₹2,000 chunks",
		subhead:
			"Enter an amount up to ₹20,000. See the fewest payments that keep each at ₹2,000 or less — and whether splitting is actually worth it.",
		intro: [
			"The MDR framework effective 15 October 2026 charges merchants 0.4% on UPI payments above ₹2,000, capped at ₹300. Payments of ₹2,000 or less carry no MDR, so some merchants ask how many ₹2,000 payments make up an amount — ₹10,000 is five.",
			"This planner works that out for amounts up to ₹20,000 (ten payments), compares the fee against a single payment, and tells you honestly when it isn’t worth it. Beyond ₹20,000 it won’t generate a plan: the fee is capped at ₹300, so splitting ₹10 lakh into 500 payments would save at most ₹300 — about ₹0.60 each.",
		],
		howTo: [
			{
				title: "Enter the amount and merchant type",
				body: "Pick a quick amount or type your own, up to ₹20,000. Choose your merchant type so the right fee rule is used.",
			},
			{
				title: "Choose the number of payments",
				body: "Use + and − to try different splits. The fewest payments that avoid the fee is shown by default.",
			},
			{
				title: "Collect and tick off",
				body: "Copy the plan, then tick each payment as it arrives. Progress is saved on your device.",
			},
		],
		faqs: [
			{
				q: "How many ₹2,000 payments make ₹10,000?",
				a: "Five. For any amount, divide by ₹2,000 and round up — the planner does this and spreads the amount evenly if it doesn’t divide exactly.",
			},
			{
				q: "Why does the planner stop at ₹20,000?",
				a: "Because beyond that, nobody sensibly splits. The MDR is capped at ₹300 per payment, so ₹10 lakh costs ₹300 as one payment but would take 500 payments to avoid. For big amounts, take one UPI payment or use a bank transfer.",
			},
			{
				q: "Is splitting a payment worth it?",
				a: "Usually only for smaller amounts. At 0.4%, a ₹10,000 payment costs ₹40, so five ₹2,000 payments save ₹40 — ₹10 for each extra payment. A ₹10 lakh payment costs just ₹300 because of the cap, so 500 payments would save ₹300 — about ₹0.60 each.",
			},
			{
				q: "Will my bank or payment provider allow it?",
				a: "This tool can’t confirm that. Providers may limit or flag repeated payments from one payer, and customers have daily UPI limits. Check with your provider before asking customers to pay in several parts.",
			},
			{
				q: "What are the alternatives for large amounts?",
				a: "Bank transfers (NEFT, RTGS or IMPS), cards or payment links may suit big payments better than hundreds of UPI payments. Check the charges with your bank.",
			},
			{
				q: "Who is exempt from MDR altogether?",
				a: "As reported, merchants receiving up to ₹1 lakh a month over UPI, all person-to-person transfers, and payments up to ₹2,000.",
			},
		],
		related: ["upi-mdr-calculator", "upi-charges-above-2000", "upi-bill-splitter"],
		updated: "October 2026",
		ctaLabel: "Try the free bill splitter",
	},
	"upi-qr-code-generator": {
		slug: "upi-qr-code-generator",
		calculator: "upi-qr",
		title: "UPI QR Code Generator",
		metaTitle: "UPI QR Code Generator — Free QR & Payment Link with Amount",
		metaDescription:
			"Create a UPI QR code and payment link from your UPI ID, with an optional amount and note. Download the PNG and scan with any UPI app. Free, no signup, nothing uploaded.",
		headline: "Make a UPI QR code in seconds",
		subhead:
			"Enter your UPI ID, add an amount and note if you like, and get a QR and pay link anyone can use.",
		privacyNote: "Generated in your browser — your UPI ID is never uploaded.",
		intro: [
			"A UPI QR code is a upi://pay link drawn as a picture. Any UPI app — GPay, PhonePe, Paytm, BHIM — can scan it and fill in who to pay, plus the amount and note if you set them.",
			"Leave the amount blank to let the payer type it, or fix it for a bill, a rent share or a collection. Download the PNG to print or send in a chat, or copy the link for your own messages.",
		],
		howTo: [
			{
				title: "Enter your UPI ID",
				body: "It looks like name@bank — for example priya@okaxis or 9876543210@ybl. Add the name you want payers to see.",
			},
			{
				title: "Add an amount and note (optional)",
				body: "Fix the amount for a specific bill, or leave it open. A note like “Rent for October” helps both sides.",
			},
			{
				title: "Download or share",
				body: "Save the QR as a PNG, or copy the pay link. Payers scan it with any UPI app.",
			},
		],
		faqs: [
			{
				q: "Is this a merchant QR?",
				a: "No. It is a standard UPI payment link for the UPI ID you enter. Businesses that accept customer payments should use the QR from their bank or payment provider; which fee rules apply depends on the type of the receiving account.",
			},
			{
				q: "Is my UPI ID stored or uploaded?",
				a: "No. The QR is generated in your browser and nothing is sent to our servers.",
			},
			{
				q: "Can I set a fixed amount?",
				a: "Yes. Apps differ in whether the payer can edit a preset amount, so don’t rely on it as a lock.",
			},
			{
				q: "Does it work with every UPI app?",
				a: "Any app that scans UPI QR codes should read it. If a payer’s app can’t, they can type your UPI ID instead.",
			},
			{
				q: "What if I change my UPI ID?",
				a: "Generate a new QR. The old one points at the old ID.",
			},
		],
		related: ["group-contribution-collector", "upi-bill-splitter", "upi-mdr-calculator"],
		schemaCategory: "UtilitiesApplication",
		ctaLabel: "Split a bill & pay via UPI",
	},
	"road-trip-cost-splitter": {
		slug: "road-trip-cost-splitter",
		calculator: "road-trip",
		title: "Road Trip Cost Splitter",
		metaTitle: "Road Trip Cost Calculator — Split Fuel, Tolls & Parking Per Person",
		metaDescription:
			"Work out the fuel, toll and parking cost of a road trip or daily carpool and split it per person. Enter distance, mileage and fuel price. Free, no signup.",
		headline: "Split the cost of a road trip",
		subhead:
			"Distance, mileage, fuel price and tolls — get the cost per person and who owes the driver.",
		intro: [
			"Fuel cost is distance ÷ mileage × fuel price. Add tolls, parking and, if you like, a per-km allowance for wear and tear, then divide by the people sharing the car.",
			"Switch to Daily carpool to see the cost per day and per month for an office commute. Share the result so everyone sees the same numbers.",
		],
		howTo: [
			{
				title: "Enter the route and the car",
				body: "Distance in km, whether it’s a round trip, and your real-world mileage (km per litre, or per kg for CNG).",
			},
			{
				title: "Add the extras",
				body: "Fuel price near you, tolls, parking, and an optional wear-and-tear rate per km.",
			},
			{
				title: "Split and share",
				body: "Name everyone (driver first) and see who owes the driver. Share the link in your group chat.",
			},
		],
		faqs: [
			{
				q: "How is the fuel cost calculated?",
				a: "Total distance ÷ mileage gives litres (or kg) used; multiply by the fuel price. A round trip counts the distance twice.",
			},
			{
				q: "Should the driver pay a share?",
				a: "Most groups split the car’s cost equally among everyone in it, including the driver. Turn the option off if riders cover the whole cost.",
			},
			{
				q: "What mileage should I use?",
				a: "Your real-world figure, not the brochure number — highway, AC and load all change it. Check the trip meter if your car shows it.",
			},
			{
				q: "What about wear and tear?",
				a: "It’s optional. If your group wants to cover tyres, servicing and depreciation, add a per-km rate; otherwise leave it at 0.",
			},
			{
				q: "Does it work for CNG or EVs?",
				a: "For CNG enter mileage in km per kg and the price per kg. For an EV, use km per unit and the price per unit of electricity.",
			},
		],
		related: ["trip-expense-splitter", "split-bill-unequally", "upi-bill-splitter"],
		schemaCategory: "TravelApplication",
		ctaLabel: "Track the whole trip in SplitBiller",
	},
	"group-contribution-collector": {
		slug: "group-contribution-collector",
		calculator: "contribution",
		title: "Group Contribution Collector",
		metaTitle: "Group Contribution Collector — Collect Equal Amounts for Gifts, Chanda & Events",
		metaDescription:
			"Collect equal contributions for a gift, festival or event: the per-person amount, a UPI QR, a WhatsApp message and a tick-list of who has paid. Free, no signup.",
		headline: "Collect contributions without the chasing",
		subhead:
			"Set the target and the people, share one UPI QR, and tick off who has paid.",
		privacyNote: "Nothing is uploaded — payments go straight to your UPI ID.",
		cta: {
			heading: "Splitting real expenses, not just collecting?",
			body: "Track who paid what and settle up with the fewest payments in the full SplitBiller app — still no signup.",
		},
		intro: [
			"Farewell gift, Ganesh puja chanda, society event, team lunch — someone always ends up collecting the money and keeping score. This tool works out an equal share, rounded up so you don’t fall short, makes a UPI QR for that amount, and keeps a tick-list.",
			"Copy the ready-made message for your group chat, then use the reminder to nudge only the people who haven’t paid. The list stays on your device.",
		],
		howTo: [
			{
				title: "Set the target and the people",
				body: "Enter the amount you need and list who’s contributing, one name per line.",
			},
			{
				title: "Share the amount and QR",
				body: "Each person’s share is rounded up to the nearest ₹1, ₹10, ₹50 or ₹100. Add your UPI ID to get a QR for that exact amount.",
			},
			{
				title: "Tick off payments",
				body: "Mark each person as they pay. The progress bar and the pending list update, and you can copy a reminder.",
			},
		],
		faqs: [
			{
				q: "How is each person’s share calculated?",
				a: "Target ÷ number of people, rounded up to the step you choose. Rounding up means you never fall short; any surplus is shown.",
			},
			{
				q: "Does the money pass through SplitBiller?",
				a: "No. People pay directly to your UPI ID. This tool only does the maths and keeps the tick-list.",
			},
			{
				q: "Is it safe to share my UPI ID?",
				a: "A UPI ID is meant to be shared so people can pay you, like a phone number. Share it with the group rather than posting it publicly.",
			},
			{
				q: "What if some people pay more or less?",
				a: "The list assumes equal shares. For unequal amounts, use the unequal bill splitter.",
			},
			{
				q: "Will my ticks be saved?",
				a: "Yes, on this device, for the same group, amount and target. Change any of them and the list starts fresh.",
			},
		],
		related: ["upi-qr-code-generator", "upi-bill-splitter", "split-bill-unequally"],
		ctaLabel: "Open full SplitBiller",
	},
	"secret-santa-generator": {
		slug: "secret-santa-generator",
		calculator: "secret-santa",
		title: "Secret Santa Generator",
		metaTitle: "Secret Santa Generator — Free Draw with Private Links, No Signup",
		metaDescription:
			"Draw Secret Santa for your group in seconds. Everyone gets a private link showing only their match. Set a budget and exclude couples. No signup, no emails.",
		headline: "Draw Secret Santa without the hat",
		subhead:
			"Add names, set a budget, and send each person their own private link.",
		privacyNote: "The draw runs in your browser — we never see the names.",
		cta: {
			heading: "Planning the party too?",
			body: "Split the venue, food and gift costs with the free SplitBiller bill splitter — no signup.",
		},
		intro: [
			"Add everyone, set a budget and an optional exchange date, and mark pairs who shouldn’t draw each other — couples, siblings, flatmates. Nobody draws themselves, and every name is drawn exactly once.",
			"Each person gets a private link that shows only who they’re buying for. The matches are never displayed to you, so the organiser can play too. Send the links on WhatsApp and you’re done.",
		],
		howTo: [
			{
				title: "Add the players",
				body: "One name per line. Set the budget and date so everyone knows the rules.",
			},
			{
				title: "Add exclusions",
				body: "Pick pairs who shouldn’t get each other. The draw respects them in both directions.",
			},
			{
				title: "Draw and send links",
				body: "Tap Draw, then send each person their own link by WhatsApp or copy it. They tap to reveal their match.",
			},
		],
		faqs: [
			{
				q: "How private is it?",
				a: "Each link contains that person’s match, so anyone who opens it can see it — send each link only to its owner. We don’t store the draw or the names.",
			},
			{
				q: "Can I play if I run the draw?",
				a: "Yes. Matches are never shown on screen, so just don’t open anyone else’s link.",
			},
			{
				q: "Can couples be kept from drawing each other?",
				a: "Yes — add them as an exclusion pair. If the exclusions make a draw impossible, the tool tells you.",
			},
			{
				q: "Do players need an account?",
				a: "No. They open the link and tap Reveal. Nothing to install or sign up for.",
			},
			{
				q: "What if I draw again?",
				a: "You get a new set of links, and the old ones no longer match the new draw. Tell everyone to use the new ones.",
			},
		],
		related: ["group-contribution-collector", "restaurant-bill-splitter", "split-bill-unequally"],
		schemaCategory: "LifestyleApplication",
		ctaLabel: "Split the party costs",
	},
	"random-name-picker": {
		slug: "random-name-picker",
		calculator: "name-picker",
		title: "Random Name Picker",
		metaTitle: "Random Name Picker Wheel — Free Spin the Wheel, No Signup",
		metaDescription:
			"Pick a random name with a free spinning wheel. Add names, spin, get a fair winner. Great for deciding who pays the bill, who goes first or who does the chores.",
		headline: "Spin the wheel, pick a name",
		subhead: "Add names, spin, and let chance decide — fair and instant.",
		intro: [
			"Paste your names, hit spin and the wheel lands on a winner. The pick uses your browser’s cryptographic random generator, so every name has exactly the same chance.",
			"Use it to decide who pays the bill, who picks the restaurant, who goes first or who does the dishes. Tick “remove the winner” to draw several people in turn.",
		],
		howTo: [
			{ title: "Add the names", body: "One per line, up to 50. Duplicates are ignored." },
			{ title: "Spin", body: "Tap the button and watch the wheel settle on a name." },
			{ title: "Draw again", body: "Spin again, or remove each winner to pick a whole order." },
		],
		faqs: [
			{ q: "Is the wheel really random?", a: "Yes. The winner is chosen first with the Web Crypto random generator, then the wheel animates to land on it — the animation never affects the result." },
			{ q: "Are my names saved?", a: "No. Everything runs in your browser; nothing is sent to our servers." },
			{ q: "How many names can I add?", a: "Up to 50. Beyond that the wheel gets too crowded to read." },
			{ q: "Can I use it to decide who pays the bill?", a: "Yes — add everyone at the table and spin. Then split the rest fairly with the free bill splitter." },
		],
		related: ["random-team-generator", "restaurant-bill-splitter", "secret-santa-generator", "split-bill-unequally"],
		schemaCategory: "UtilitiesApplication",
		cta: { heading: "Settled who pays?", body: "Now split the bill fairly with the free SplitBiller bill splitter — no signup." },
		ctaLabel: "Open full SplitBiller",
	},
	"random-team-generator": {
		slug: "random-team-generator",
		calculator: "team-generator",
		title: "Random Team Generator",
		metaTitle: "Random Team Generator — Split Names into Fair Teams, Free",
		metaDescription:
			"Split a list of names into random, evenly sized teams in one click. Choose the number of teams or people per team. Free, no signup.",
		headline: "Make fair teams in one click",
		subhead: "Paste your players, choose how many teams, and shuffle.",
		intro: [
			"Paste a list of names and get random teams of even size — sizes never differ by more than one person. Pick the number of teams or the number of people per team.",
			"Perfect for sports, classroom groups, game nights and office events. Shuffle again until everyone is happy, then copy the teams to WhatsApp.",
		],
		howTo: [
			{ title: "Add the players", body: "One name per line." },
			{ title: "Choose the split", body: "Either a number of teams or people per team." },
			{ title: "Shuffle and copy", body: "Reshuffle as often as you like, then copy the result." },
		],
		faqs: [
			{ q: "Are the teams balanced?", a: "Team sizes are as even as possible. The tool doesn’t rate skill — it’s a fair random draw." },
			{ q: "What if the numbers don’t divide evenly?", a: "Some teams get one extra person." },
			{ q: "Is anything stored?", a: "No. The shuffle runs in your browser." },
		],
		related: ["random-name-picker", "secret-santa-generator", "group-contribution-collector"],
		schemaCategory: "UtilitiesApplication",
		cta: { heading: "Splitting the cost too?", body: "Share the pitch fee or party bill with the free SplitBiller bill splitter." },
		ctaLabel: "Open full SplitBiller",
	},
	"gst-calculator": {
		slug: "gst-calculator",
		calculator: "gst",
		title: "GST Calculator",
		metaTitle: "GST Calculator India — Add or Remove GST (CGST + SGST), Free",
		metaDescription:
			"Free GST calculator for India. Add GST to a price or remove it from a GST-inclusive amount at 5%, 12%, 18%, 28% or any rate, with CGST and SGST breakup and a per-person split.",
		headline: "Add or remove GST instantly",
		subhead: "Enter an amount and a rate to see the GST, CGST, SGST and final price.",
		intro: [
			"Add GST to a price, or work backwards from a GST-inclusive amount to find the original price and the tax. Choose the common slabs — 5%, 12%, 18%, 28% — or type any rate.",
			"The result shows the CGST and SGST halves for intra-state sales. Need to share a GST bill? Enter the number of people to see each person’s share.",
		],
		howTo: [
			{ title: "Pick add or remove", body: "Add GST to a pre-tax price, or remove it from a final price." },
			{ title: "Enter amount and rate", body: "Tap a slab or type your own rate." },
			{ title: "Read the breakup", body: "See base price, GST, CGST, SGST and total." },
		],
		faqs: [
			{ q: "How is GST calculated?", a: "Adding GST: price × (1 + rate ÷ 100). Removing GST: price ÷ (1 + rate ÷ 100)." },
			{ q: "What are CGST and SGST?", a: "For sales within a state, GST splits equally into central (CGST) and state (SGST) halves. For inter-state sales the full amount is IGST." },
			{ q: "Which GST rates are valid?", a: "Check the current slabs on the official GST portal — rates and goods categories change. You can enter any rate here." },
			{ q: "Is this tax advice?", a: "No. It’s a calculator; confirm figures with your invoice or accountant." },
		],
		related: ["split-bill-with-tax", "upi-bill-splitter", "discount-calculator"],
		schemaCategory: "FinanceApplication",
		cta: { heading: "Splitting a GST bill?", body: "Use the free SplitBiller UPI bill splitter to settle up in ₹." },
		ctaLabel: "Open full SplitBiller",
	},
	"discount-calculator": {
		slug: "discount-calculator",
		calculator: "discount",
		title: "Discount Calculator",
		metaTitle: "Discount Calculator — Sale Price, Savings & Stacked Discounts, Free",
		metaDescription:
			"Free discount calculator: find the final price and how much you save, including a second extra-off coupon. See your true effective discount and split the cost.",
		headline: "See the real price after discounts",
		subhead: "Enter the price and discount — add an extra coupon to see the stacked saving.",
		intro: [
			"Enter an original price and a percentage off to get the sale price and your savings. Add an extra coupon and the calculator applies it after the first discount, as shops do.",
			"Stacked discounts don’t add up: 30% then 10% off is 37% off, not 40%. The effective discount shows the true figure.",
		],
		howTo: [
			{ title: "Enter the price", body: "Use any currency." },
			{ title: "Add discounts", body: "A main discount, plus an optional extra coupon." },
			{ title: "Compare", body: "See what you pay, what you save and the effective percentage." },
		],
		faqs: [
			{ q: "Do two discounts add up?", a: "No. The second applies to the already-reduced price, so 30% + 10% is 37% off in total." },
			{ q: "How is the sale price calculated?", a: "Price × (1 − discount ÷ 100), applied once per discount." },
			{ q: "Can I split a discounted bill?", a: "Yes — enter the number of people and see each share." },
		],
		related: ["gst-calculator", "split-bill-with-tip", "restaurant-bill-splitter"],
		schemaCategory: "FinanceApplication",
		cta: { heading: "Sharing the purchase?", body: "Split it fairly with the free SplitBiller bill splitter." },
		ctaLabel: "Open full SplitBiller",
	},
};

export const ALL_TOOL_SLUGS = Object.keys(TOOL_PAGES) as ToolSlug[];

export function getToolTitle(slug: ToolSlug): string {
	return TOOL_PAGES[slug].title;
}
