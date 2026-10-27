import type { Group } from "@/types";
import { myTotals, type MyTotal } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatting";

/**
 * The Play app's home-screen widget shows what you get back and owe. The app opens a
 * message channel to this page through Chrome and says hello; the page answers with the
 * two totals, and again whenever they change. Chrome hands them straight to the app on
 * the same phone, so nothing reaches a server. Chrome marks the hello as coming from our
 * own origin only for the app listed in /.well-known/assetlinks.json, so a page that
 * opened this one can't ask for the totals.
 */
const HELLO = "splitbiller:widget";

/** "₹1,200" or "₹300 + $20" per side; "" when there's nothing. */
export const widgetTotals = (groups: Group[]) => {
	const totals = myTotals(groups);
	const side = (amount: (t: MyTotal) => number) =>
		totals
			.filter((t) => amount(t) > 0)
			.map((t) => formatCurrency(amount(t), t.currency))
			.join(" + ");
	return { getBack: side((t) => t.getBack), owe: side((t) => t.owe) };
};

let port: MessagePort | undefined;
let latest: string | undefined;
const send = () => latest && port?.postMessage(latest);

// Listen from the moment the page loads: the app says hello once the page has loaded.
if (typeof window !== "undefined") {
	window.addEventListener("message", (e) => {
		if (e.origin !== window.location.origin || e.data !== HELLO || !e.ports[0]) return;
		port = e.ports[0];
		send();
	});
}

/** Keeps the widget current. Outside the Play app no one says hello, so nothing is sent. */
export const updateWidget = (groups: Group[]) => {
	latest = JSON.stringify(widgetTotals(groups));
	send();
};
