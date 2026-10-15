// Tests for utils/recurring.ts: monthly expenses.
//   node --test --experimental-strip-types scripts/recurring.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_CATCH_UP, addDueRepeats, dueAt, firstRepeat } from "../utils/recurring.ts";

const at = (y, m, d) => new Date(y, m - 1, d, 12).getTime();
const rent = (overrides = {}) => ({
	id: "expense-rent",
	amount: 30000,
	paidBy: "p1",
	participants: ["p1", "p2", "p3"],
	description: "Rent",
	splitMethod: "equally",
	createdAt: at(2026, 10, 5),
	repeat: { next: "2026-11" },
	...overrides,
});

test("the first copy is due the month after", () => {
	assert.equal(firstRepeat(at(2026, 10, 15)), "2026-11");
	assert.equal(firstRepeat(at(2026, 12, 31)), "2027-01");
});

test("nothing changes before the day comes round", () => {
	const expenses = [rent()];
	assert.equal(addDueRepeats(expenses, at(2026, 11, 4)), expenses);
});

test("on the day, a copy is added and the schedule moves on", () => {
	const [original, copy, ...rest] = addDueRepeats([rent()], at(2026, 11, 5));
	assert.equal(rest.length, 0);
	assert.deepEqual(original.repeat, { next: "2026-12" });
	assert.equal(copy.id, "expense-rent-2026-11");
	assert.equal(copy.amount, 30000);
	assert.equal(copy.repeat, undefined);
	assert.equal(copy.createdAt, at(2026, 11, 5));
});

test("months missed while nobody opened the group are all filled in", () => {
	const out = addDueRepeats([rent()], at(2027, 2, 20));
	assert.deepEqual(out.slice(1).map((e) => e.id), ["expense-rent-2026-11", "expense-rent-2026-12", "expense-rent-2027-01", "expense-rent-2027-02"]);
	assert.deepEqual(out[0].repeat, { next: "2027-03" });
});

test("a long absence fills in at most a year", () => {
	const out = addDueRepeats([rent({ repeat: { next: "2020-01" } })], at(2027, 2, 20));
	assert.equal(out.length - 1, MAX_CATCH_UP);
	assert.equal(out.at(-1).id, "expense-rent-2027-02");
});

test("two phones adding the same month write the same entry", () => {
	const now = at(2026, 11, 9);
	assert.deepEqual(addDueRepeats([rent()], now), addDueRepeats([rent()], now));
});

test("a copy that's already there isn't added twice", () => {
	const synced = [rent(), { ...rent({ id: "expense-rent-2026-11" }), repeat: undefined }];
	const out = addDueRepeats(synced, at(2026, 11, 9));
	assert.equal(out.filter((e) => e.id === "expense-rent-2026-11").length, 1);
});

test("the 31st falls on the last day of shorter months", () => {
	assert.equal(dueAt("2027-02", 31), at(2027, 2, 28));
	assert.equal(dueAt("2026-11", 31), at(2026, 11, 30));
});

test("payments and expenses without a schedule are left alone", () => {
	const expenses = [rent({ repeat: undefined }), rent({ id: "pay", kind: "payment" })];
	assert.equal(addDueRepeats(expenses, at(2030, 1, 1)), expenses);
});
