export type ToolSlug =
	| "restaurant-bill-splitter"
	| "trip-expense-splitter"
	| "split-bill-with-tax"
	| "split-bill-with-tip"
	| "split-bill-unequally"
	| "roommate-expense-splitter"
	| "split-bill-without-signup"
	| "splitwise-alternative"
	| "upi-bill-splitter"
	| "upi-charges-above-2000"
	| "upi-mdr-calculator"
	| "split-electricity-bill"
	| "split-swiggy-zomato-bill";

export type CalculatorKind =
	| "restaurant"
	| "tip"
	| "tax"
	| "unequal"
	| "trip"
	| "roommate"
	| "simple"
	| "upi"
	| "splitwise"
	| "upi-fee-customer"
	| "upi-fee-merchant";

export type ToolFaq = { q: string; a: string };

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
	faqs: ToolFaq[];
	related: ToolSlug[];
	ctaLabel: string;
};

export const TOOL_PAGES: Record<ToolSlug, ToolPageConfig> = {
	"restaurant-bill-splitter": {
		slug: "restaurant-bill-splitter",
		calculator: "restaurant",
		title: "Restaurant Bill Splitter",
		metaTitle: "Restaurant Bill Splitter — Split Dinner with Tip & Service Charge",
		metaDescription:
			"Split a restaurant bill among friends including tip or service charge. Instant per-person amounts, then share an encrypted settlement link. No signup.",
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
		],
		ctaLabel: "Open full SplitBiller",
	},
	"trip-expense-splitter": {
		slug: "trip-expense-splitter",
		calculator: "trip",
		title: "Trip Expense Splitter",
		metaTitle: "Trip Expense Splitter — Split Travel Costs Fairly",
		metaDescription:
			"Track and split trip expenses — hotels, food, transport, activities. Minimize who owes whom and share a private settlement link.",
		headline: "Split trip expenses without the spreadsheet",
		subhead:
			"Log flights, hotels, meals, and rides. See who is owed what, then share the settlement.",
		intro: [
			"Group trips accumulate uneven spending — one person books the hotel, another covers taxis, someone else pays for dinner. This tool totals everything and settles with the fewest payments.",
			"Start with a quick multi-expense calculator here, then open the full app for ongoing trip tracking.",
		],
		howTo: [
			{
				title: "Add each trip expense",
				body: "Name it (hotel, Uber, groceries), enter the amount, and who paid.",
			},
			{
				title: "Include everyone on the trip",
				body: "Expenses are split among the people you list — skip anyone who sat that one out by editing in the full app.",
			},
			{
				title: "Settle at the end",
				body: "Share one encrypted link so the whole group sees the final who-owes-whom.",
			},
		],
		faqs: [
			{
				q: "Can I mix currencies?",
				a: "Pick one currency for the trip (convert rough amounts before entering) to keep settlements simple.",
			},
			{
				q: "What if not everyone shared every expense?",
				a: "Use the full SplitBiller dashboard to exclude people from specific expenses.",
			},
		],
		related: [
			"roommate-expense-splitter",
			"split-bill-unequally",
			"splitwise-alternative",
		],
		ctaLabel: "Track the whole trip in SplitBiller",
	},
	"split-bill-with-tax": {
		slug: "split-bill-with-tax",
		calculator: "tax",
		title: "Split Bill with Tax",
		metaTitle: "Split Bill with Tax Calculator — Fair Shares Including Tax",
		metaDescription:
			"Calculate each person’s share of a bill including sales tax or GST. Instant tax-inclusive split with a shareable settlement link.",
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
		metaTitle: "Split Bill with Tip Calculator — Tip % Then Divide",
		metaDescription:
			"Add a tip percentage to your bill and split among friends. Quick tip calculator with per-person totals and private share links.",
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
		metaTitle: "Split Bill Unequally — Custom Shares by Amount or %",
		metaDescription:
			"Split a bill unevenly by custom amounts or percentages. Ideal when people ordered differently. Share the settlement privately.",
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
		metaTitle: "Roommate Expense Splitter — Rent, Utilities & Shared Bills",
		metaDescription:
			"Split rent, utilities, groceries, and household bills among roommates. Fair settlements without forcing everyone onto an app account.",
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
				a: "Yes — use percentage or custom amounts for rent, and equal split for shared groceries.",
			},
			{
				q: "Do we need an ongoing account?",
				a: "No. Keep using the browser tool; data stays on each device unless you share a link.",
			},
		],
		related: [
			"split-bill-unequally",
			"splitwise-alternative",
			"split-bill-without-signup",
			"split-electricity-bill",
		],
		ctaLabel: "Manage monthly splits in SplitBiller",
	},
	"split-bill-without-signup": {
		slug: "split-bill-without-signup",
		calculator: "simple",
		title: "Split Bills Without Signup",
		metaTitle: "Split Bills Without Signup — No Login Expense Splitter",
		metaDescription:
			"Split group expenses with no account, no app download, and no cloud storage. Privacy-first bill splitter you can use instantly.",
		headline: "Split bills with zero signup",
		subhead:
			"No email, no app store, no account. Open the page, split the bill, share the result.",
		intro: [
			"Most expense apps force signups before you can add a single lunch. SplitBiller runs in the browser — calculate and share immediately.",
			"Privacy is the point: expenses stay on your device. Share links encrypt the split in the URL fragment so our servers never receive it.",
		],
		howTo: [
			{
				title: "Use the calculator",
				body: "Enter amount, people, and who paid — no form asking for your email first.",
			},
			{
				title: "Share the settlement",
				body: "Friends open the link and see the same result in their browser.",
			},
			{
				title: "Optional: keep editing",
				body: "Open in SplitBiller to save on this device for ongoing groups.",
			},
		],
		faqs: [
			{
				q: "Is it really free without signup?",
				a: "Yes. No freemium gate for basic splitting. No account required.",
			},
			{
				q: "What happens if I clear my browser data?",
				a: "Local groups are cleared. Shared links still work for anyone who has them, since the data is in the link itself.",
			},
		],
		related: [
			"splitwise-alternative",
			"restaurant-bill-splitter",
			"upi-bill-splitter",
		],
		ctaLabel: "Start without signup",
	},
	"splitwise-alternative": {
		slug: "splitwise-alternative",
		calculator: "splitwise",
		title: "Splitwise Alternative",
		metaTitle: "Splitwise Alternative — Free, No Login Bill Splitter",
		metaDescription:
			"Looking for a Splitwise alternative? SplitBiller splits expenses with no signup, no app, and privacy-preserving share links.",
		headline: "A Splitwise alternative without the account",
		subhead:
			"Same job — who owes whom — without forcing friends to download an app or create logins.",
		intro: [
			"Splitwise is great for long-running groups. For one-off dinners, weekend trips, or privacy-conscious friends, the signup friction kills momentum.",
			"SplitBiller focuses on instant splits and shareable settlements. No social graph, no cloud ledger of your spending.",
		],
		howTo: [
			{
				title: "Skip the app install",
				body: "Works in any mobile or desktop browser.",
			},
			{
				title: "Split equal or unequal",
				body: "Percentages and multi-expense groups are supported in the full app.",
			},
			{
				title: "Share privately",
				body: "Encrypted links replace “invite friends to the app.”",
			},
		],
		faqs: [
			{
				q: "How is this different from Splitwise?",
				a: "No accounts, no cloud expense history, share-via-encrypted-URL instead of inviting users to a platform.",
			},
			{
				q: "Can it replace Splitwise for roommates?",
				a: "For many groups, yes — especially if you settle monthly and don’t need IOU history across years.",
			},
			{
				q: "Is there a mobile app?",
				a: "No download needed. Add the site to your home screen if you want an app-like shortcut.",
			},
		],
		related: [
			"split-bill-without-signup",
			"roommate-expense-splitter",
			"trip-expense-splitter",
		],
		ctaLabel: "Try SplitBiller free",
	},
	"upi-bill-splitter": {
		slug: "upi-bill-splitter",
		calculator: "upi",
		title: "UPI Bill Splitter",
		metaTitle: "UPI Bill Splitter — Split & Pay via UPI (₹)",
		metaDescription:
			"Split bills in rupees and generate UPI payment links for each settlement. Perfect for India — no signup, share privately.",
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
			"split-bill-without-signup",
			"roommate-expense-splitter",
			"upi-charges-above-2000",
		],
		ctaLabel: "Open SplitBiller (₹)",
	},
	"upi-charges-above-2000": {
		slug: "upi-charges-above-2000",
		calculator: "upi-fee-customer",
		title: "UPI Charges Above ₹2,000",
		metaTitle: "UPI Charges Above ₹2,000 — Do You Pay? (15 Oct 2026 MDR Explained)",
		metaDescription:
			"From 15 Oct 2026 a 0.4% MDR applies to some merchant UPI payments above ₹2,000 — charged to the merchant, not you. Check what you pay, and split bills with friends free.",
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
		related: ["upi-mdr-calculator", "upi-bill-splitter", "restaurant-bill-splitter"],
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
		related: ["upi-charges-above-2000", "upi-bill-splitter", "split-bill-with-tax"],
		ctaLabel: "Try the free bill splitter",
	},
	"split-electricity-bill": {
		slug: "split-electricity-bill",
		calculator: "unequal",
		title: "Split Electricity Bill",
		metaTitle: "Split Electricity Bill Between Roommates — Fair by Usage or Equal",
		metaDescription:
			"Split an electricity bill fairly between roommates or flatmates — equally, by room, or by AC and meter usage. Instant ₹ shares and a UPI-ready settlement link.",
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
		faqs: [
			{
				q: "What is the fairest way to split electricity between roommates?",
				a: "Split fixed charges equally and energy charges by usage — sub-meter units if you have them, otherwise AC or heater hours. If usage is similar, an equal split is fine.",
			},
			{
				q: "How do I split a bill when one person uses the AC more?",
				a: "Use the percentage mode: give the heavier user a larger percentage, for example 40/30/30, and the calculator works out the amounts.",
			},
			{
				q: "How do I split it every month?",
				a: "Reuse the same percentages each month. For rent, groceries and the bill together, use the roommate expense splitter.",
			},
		],
		related: ["roommate-expense-splitter", "split-bill-unequally", "upi-bill-splitter"],
		ctaLabel: "Track monthly bills in SplitBiller",
	},
	"split-swiggy-zomato-bill": {
		slug: "split-swiggy-zomato-bill",
		calculator: "restaurant",
		title: "Split Swiggy / Zomato Bill",
		metaTitle: "Split a Swiggy or Zomato Group Order — Delivery Fee, GST & Discounts",
		metaDescription:
			"Split a Swiggy or Zomato group order fairly including delivery fee, platform fee and GST. Instant per-person ₹ amounts and a UPI-ready settlement link.",
		headline: "Split a Swiggy or Zomato order fairly",
		subhead:
			"Add the final amount you paid, count the people, and get each person’s share in seconds.",
		intro: [
			"Group food orders get messy: item prices, delivery fee, platform fee, GST and discounts all land on one person’s card. The simplest fair method is to split the final amount you actually paid — everything included.",
			"Enter that amount, add any extra fixed charge, choose how many people ordered, and share the result. If orders differ a lot, use the unequal splitter so each person pays for their own items. SplitBiller isn’t affiliated with Swiggy or Zomato.",
		],
		howTo: [
			{
				title: "Enter what you paid",
				body: "Use the final total from the order summary, after discounts, taxes and fees.",
			},
			{
				title: "Add anything extra",
				body: "A tip for the delivery partner can be added as a fixed amount or a percentage.",
			},
			{
				title: "Share and settle",
				body: "Send the link in your group chat and everyone pays you their share by UPI.",
			},
		],
		faqs: [
			{
				q: "How do I split delivery fee and GST?",
				a: "If everyone ordered similar amounts, split the final total equally. If not, split items by person and share fees and GST in proportion, or use the unequal splitter.",
			},
			{
				q: "What about a coupon or discount?",
				a: "Use the final amount after the discount, so everyone benefits from it equally.",
			},
			{
				q: "How do friends pay me back?",
				a: "Share the settlement link and have them send their share by UPI. Person-to-person UPI transfers are free.",
			},
		],
		related: ["restaurant-bill-splitter", "split-bill-unequally", "upi-bill-splitter"],
		ctaLabel: "Open full SplitBiller",
	},
};

export const ALL_TOOL_SLUGS = Object.keys(TOOL_PAGES) as ToolSlug[];

export function getToolTitle(slug: ToolSlug): string {
	return TOOL_PAGES[slug].title;
}
