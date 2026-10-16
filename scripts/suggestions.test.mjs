// Tests for utils/suggestions.ts: suggestions from a group's own history.
//   node --test --experimental-strip-types scripts/suggestions.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { findDuplicate, looksMonthly, suggestPast } from "../utils/suggestions.ts";

const at = (m, d) => new Date(2026, m - 1, d, 12).getTime();
let n = 0;
const x = (description, amount, createdAt, extra = {}) => ({ id: `e${++n}`, description, amount, paidBy: "p1", participants: ["p1", "p2"], splitMethod: "equally", createdAt, ...extra });

const history = [
	x("Rent", 25000, at(8, 1)),
	x("Dinner at Toit", 2400, at(9, 3)),
	x("Rent", 25000, at(9, 1)),
	x("Groceries", 800, at(9, 20)),
	x("groceries", 950, at(10, 2)),
	{ ...x("Rent", 25000, at(10, 1)), kind: "payment" },
];

test("with nothing typed, repeated ones come first, latest of each, ties newest first", () => {
	assert.deepEqual(suggestPast(history, "").map((e) => [e.description, e.amount]), [["groceries", 950], ["Rent", 25000]]);
	assert.deepEqual(suggestPast([...history, x("Rent", 25000, at(10, 1))], "").map((e) => e.description), ["Rent", "groceries"]);
});

test("typing matches the start of any word, newest first, not the exact text", () => {
	assert.deepEqual(suggestPast(history, "to").map((e) => e.description), ["Dinner at Toit"]);
	assert.deepEqual(suggestPast(history, "GRO").map((e) => e.description), ["groceries"]);
	assert.deepEqual(suggestPast(history, "rent"), []);
	assert.deepEqual(suggestPast(history, "cab"), []);
});

test("something added in two different months looks monthly, unless it already repeats", () => {
	assert.equal(looksMonthly(history, "rent "), true);
	assert.equal(looksMonthly(history, "Dinner at Toit"), false);
	assert.equal(looksMonthly([...history, x("Rent", 25000, at(10, 1), { repeat: { next: "2026-11" } })], "Rent"), false);
});

test("the same amount within two days may be a duplicate", () => {
	assert.equal(findDuplicate(history, 2400, at(9, 4))?.description, "Dinner at Toit");
	assert.equal(findDuplicate(history, 2400, at(9, 6)), undefined);
	assert.equal(findDuplicate(history, 2500, at(9, 3)), undefined);
	// A recorded payment isn't spending.
	assert.equal(findDuplicate(history, 25000, at(10, 1)), undefined);
});
