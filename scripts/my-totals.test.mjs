// Tests for the home screen's "You owe · You get back" across groups.
//   node --test --experimental-strip-types scripts/my-totals.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { myTotals } = await import("../utils/calculations.ts");

const INR = { code: "INR", symbol: "₹", name: "Indian Rupee" };
const EUR = { code: "EUR", symbol: "€", name: "Euro" };
const members = [{ id: "me", name: "Asha" }, { id: "p2", name: "Riya" }];
// `paidBy` paid `amount`, split equally between the two of them.
const group = (id, paidBy, amount, extra = {}) => ({
	id,
	name: id,
	currency: INR,
	members,
	meId: "me",
	expenses: [{ id: `${id}-e`, amount, paidBy, participants: ["me", "p2"], splitMethod: "equally" }],
	...extra,
});

test("adds up what you owe and get back, per currency", () => {
	const totals = myTotals([group("a", "me", 1000), group("b", "me", 300), group("c", "p2", 800), group("d", "me", 40, { currency: EUR })]);
	assert.deepEqual(totals, [
		{ currency: INR, owe: 400, getBack: 650 },
		{ currency: EUR, owe: 0, getBack: 20 },
	]);
});

test("skips closed groups, settled groups and groups where you haven't said who you are", () => {
	const settled = { ...group("s", "me", 1000), expenses: [] };
	const totals = myTotals([group("a", "me", 1000, { closedAt: 1 }), group("b", "me", 1000, { meId: undefined }), settled]);
	assert.deepEqual(totals, []);
});
