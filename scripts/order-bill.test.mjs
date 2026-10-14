// Tests for utils/orderBill.ts: parsing real OCR output of order screenshots
// (scripts/fixtures/orders/*.txt, from mock-ups of Swiggy, Zomato and
// Instamart order pages) and splitting an order fairly.
//   node --test --experimental-strip-types scripts/order-bill.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseOrderText, splitOrder } from "../utils/orderBill.ts";

const fixture = (name) => parseOrderText(readFileSync(new URL(`./fixtures/orders/${name}.txt`, import.meta.url), "utf8"));
const amounts = (rows) => rows.map((r) => r.amount);

test("Swiggy: ₹ read as 3, ¥, $ or dropped still gives the right amounts", () => {
	const o = fixture("swiggy");
	assert.equal(o.app, "Swiggy");
	assert.equal(o.title, "Behrouz Biryani");
	assert.deepEqual(o.items.map((i) => [i.qty, i.name, i.amount]), [
		[1, "Paneer Butter Masala", 320],
		[2, "Chicken Dum Biryani", 598],
		[4, "Butter Naan", 180],
	]);
	assert.deepEqual(amounts(o.charges), [39, 10, 82.35, -150]);
	assert.equal(o.itemTotal, 1098);
	assert.equal(o.total, 1079.35);
	assert.equal(o.balanced, true);
});

test("Zomato: quantity first, struck-out prices ignored, discount negative", () => {
	const o = fixture("zomato");
	assert.equal(o.app, "Zomato");
	assert.equal(o.title, "Pizza Hut");
	assert.deepEqual(o.items.map((i) => [i.qty, i.name, i.amount]), [
		[2, "Margherita Pizza (Medium)", 598],
		[1, "Garlic Breadsticks", 129],
		[1, "Choco Volcano Cake", 99],
	]);
	assert.deepEqual(o.charges.map((c) => c.kind), ["tax", "fee", "fee", "fee", "discount"]);
	assert.equal(o.total, 798.3);
	assert.equal(o.balanced, true);
});

test("Dark mode, a wrapped item name and a dish called Paneer 65", () => {
	const o = fixture("swiggyDark");
	assert.deepEqual(o.items.map((i) => [i.qty, i.name, i.amount]), [
		[1, "Special Chicken Boneless Biryani with Extra Raita and Gravy", 425],
		[1, "Paneer 65", 290],
		[3, "Lime Soda", 180],
	]);
	assert.deepEqual(amounts(o.charges), [20, 25, 10, 68.6]);
	assert.equal(o.total, 1018.6);
	assert.equal(o.balanced, true);
});

test("Instamart: a FREE delivery line and a coupon", () => {
	const o = fixture("instamart");
	assert.equal(o.app, "Instamart");
	assert.deepEqual(amounts(o.items), [136, 265, 45, 449]);
	assert.deepEqual(amounts(o.charges), [4, -50]);
	assert.equal(o.total, 849);
	assert.equal(o.balanced, true);
});

test("Rs. prefixes, thousands with dots, and no item total", () => {
	const o = parseOrderText(["Masala Dosa x 2 Rs. 240", "Filter Coffee x 2 Rs.80", "Taxes Rs 16", "Total paid Rs. 1.336.00"].join("\n"));
	assert.deepEqual(amounts(o.items), [240, 80]);
	assert.deepEqual(amounts(o.charges), [16]);
	assert.equal(o.total, 1336);
	assert.equal(o.balanced, false); // 240 + 80 + 16 isn't 1,336: flagged for the person to check
});

test("A bill that adds up without any reading changes stays as read", () => {
	const o = parseOrderText(["2 x Veg Thali 300", "1 x Lassi 30", "Item total 330", "Grand total 330"].join("\n"));
	assert.deepEqual(amounts(o.items), [300, 30]);
	assert.equal(o.total, 330);
	assert.equal(o.balanced, true);
});

test("Nothing order-like reads as an empty, unbalanced order", () => {
	const o = parseOrderText("Hello there\nHow are you");
	assert.equal(o.items.length, 0);
	assert.equal(o.total, undefined);
	assert.equal(o.balanced, false);
});

test("splitOrder: items to who had them, extras in proportion, exact to the paisa", () => {
	const shares = splitOrder(
		[
			{ amount: 320, people: ["a"] }, // Paneer: Asha
			{ amount: 598, people: ["b", "c"] }, // Biryani: Ben and Chen
			{ amount: 180, people: [] }, // Naan: everyone
		],
		1079.35,
		["a", "b", "c"]
	);
	const by = Object.fromEntries(shares.map((s) => [s.personId, s]));
	assert.equal(by.a.itemAmount, 380);
	assert.equal(by.b.itemAmount, 359);
	// Extras (-18.65) are spread by item share: 380/1098 of 1079.35 = 373.55…
	assert.ok(Math.abs(by.a.amount - 373.55) <= 0.01);
	assert.equal(Math.round(shares.reduce((s, x) => s + x.amount, 0) * 100), 107935);
	assert.ok(Math.abs(by.b.amount - by.c.amount) <= 0.01);
});

test("splitOrder: nobody picked anywhere is an even split; people with nothing owe nothing", () => {
	const even = splitOrder([{ amount: 100, people: [] }], 101, ["a", "b", "c"]);
	assert.deepEqual(even.map((s) => s.amount).sort(), [33.66, 33.67, 33.67]);
	const one = splitOrder([{ amount: 100, people: ["b"] }], 120, ["a", "b", "c"]);
	assert.deepEqual(one, [{ personId: "b", amount: 120, itemAmount: 100 }]);
});
