// Tests for lib/androidWidget.ts: the Play app's widget gets the totals, and only the app does.
//   node --test --experimental-strip-types scripts/android-widget.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);

// The page's window: a message listener the tests can call like Chrome would.
let onMessage;
globalThis.window = { location: { origin: "https://splitbiller.com" }, addEventListener: (_, fn) => (onMessage = fn) };
const { widgetTotals, updateWidget } = await import("../lib/androidWidget.ts");

const INR = { code: "INR", symbol: "₹", name: "Indian Rupee" };
const USD = { code: "USD", symbol: "$", name: "US Dollar" };
const members = [{ id: "me", name: "Asha" }, { id: "p2", name: "Riya" }];
const group = (id, paidBy, amount, currency = INR) => ({
	id,
	name: id,
	currency,
	members,
	meId: "me",
	expenses: [{ id: `${id}-e`, amount, paidBy, participants: ["me", "p2"], splitMethod: "equally" }],
});

/** Says hello the way the app does, from `origin`; returns what the page sends back. */
const hello = (origin, data = "splitbiller:widget") => {
	const { port1, port2 } = new MessageChannel();
	const received = [];
	port2.onmessage = (e) => received.push(JSON.parse(e.data));
	onMessage({ origin, data, ports: [port1] });
	return { received, close: () => port2.close() };
};
const settle = () => new Promise((r) => setTimeout(r, 10));

test("formats each side, joining currencies", () => {
	assert.deepEqual(widgetTotals([group("a", "me", 2400), group("b", "p2", 600), group("c", "p2", 40, USD)]), {
		getBack: "₹1,200",
		owe: "₹300 + $20.00",
	});
	assert.deepEqual(widgetTotals([]), { getBack: "", owe: "" });
});

test("answers the app's hello with the totals, then sends every change", async () => {
	updateWidget([group("a", "me", 2400)]);
	const app = hello("https://splitbiller.com");
	updateWidget([group("a", "me", 2400), group("b", "p2", 600)]);
	await settle();
	assert.deepEqual(app.received, [
		{ getBack: "₹1,200", owe: "" },
		{ getBack: "₹1,200", owe: "₹300" },
	]);
	app.close();
});

test("ignores a hello from another site, or anything that isn't the hello", async () => {
	const other = hello("https://evil.example");
	const wrong = hello("https://splitbiller.com", "hi");
	await settle();
	assert.deepEqual(other.received, []);
	assert.deepEqual(wrong.received, []);
	other.close();
	wrong.close();
});
