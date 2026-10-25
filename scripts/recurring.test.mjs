// Tests for utils/recurring.ts: monthly expenses.
//   node --test --experimental-strip-types scripts/recurring.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { MAX_CATCH_UP, addDueRepeats, addDueRepeatsToGroups, dueAt, firstRepeat } from "../utils/recurring.ts";

register("./fixtures/alias.mjs", import.meta.url);
const { applyOp, diffGroup, emptyState, groupAsChanges, materialize } = await import("../utils/groupOps.ts");

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

const flat = (overrides = {}) => ({
	id: "g",
	name: "Flat",
	currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
	members: [{ id: "p1", name: "Asha" }, { id: "p2", name: "Ben" }, { id: "p3", name: "Kabir" }],
	expenses: [rent()],
	...overrides,
});

test("a synced group gets its copies only once this device has pulled it", () => {
	const now = at(2026, 11, 9);
	const synced = [flat({ sync: { secret: "s" } })];
	assert.equal(addDueRepeatsToGroups(synced, new Set(), now), synced);
	assert.equal(addDueRepeatsToGroups(synced, new Set(["g"]), now)[0].expenses.length, 2);
	assert.equal(addDueRepeatsToGroups([flat()], new Set(), now)[0].expenses.length, 2);
	const closed = [flat({ closedAt: at(2026, 10, 30) })];
	assert.equal(addDueRepeatsToGroups(closed, new Set(), now), closed);
});

test("a phone that was away doesn't bring back a deleted copy or undo an edit", () => {
	// The merged state everyone converges on; each edit is stamped when it's made, like stamp() in groupSync.
	const server = emptyState();
	let n = 0;
	const record = (changes, t) => changes.forEach((c) => applyOp(server, { ...c, i: `o${++n}`, t: t++ }));
	const open = () => materialize(server, { id: "g", sync: { secret: "s" } });
	record(groupAsChanges(flat()), at(2026, 10, 5));
	const stale = open();

	// Asha, 10 Nov: the copy is added, then she deletes it and renames the original.
	const asha = open();
	const withCopy = { ...asha, expenses: addDueRepeats(asha.expenses, at(2026, 11, 10)) };
	record(diffGroup(asha, withCopy), at(2026, 11, 10));
	const edited = { ...withCopy, expenses: [{ ...withCopy.expenses[0], description: "Rent + maintenance" }] };
	record(diffGroup(withCopy, edited), at(2026, 11, 10) + 100);

	// Ben, 12 Nov: his out-of-date copy is left alone until it's pulled...
	assert.equal(addDueRepeatsToGroups([stale], new Set(), at(2026, 11, 12))[0], stale);
	// ...and once pulled nothing is due, so nothing of Asha's is overwritten.
	const pulled = open();
	const [ben] = addDueRepeatsToGroups([pulled], new Set(["g"]), at(2026, 11, 12));
	record(diffGroup(pulled, ben), at(2026, 11, 12));
	assert.deepEqual(open().expenses.map((e) => [e.id, e.description]), [["expense-rent", "Rent + maintenance"]]);
});

test("someone who left isn't on new copies", () => {
	const [original, copy] = addDueRepeats([rent()], at(2026, 11, 5), new Set(["p3"]));
	assert.deepEqual(copy.participants, ["p1", "p2"]);
	assert.deepEqual(original.participants, ["p1", "p2", "p3"]);
	assert.deepEqual(original.repeat, { next: "2026-12" });
});

test("it stops repeating when the payer left or the split was set per person", () => {
	for (const e of [rent({ paidBy: "p3" }), rent({ splitMethod: "percentage", percentages: { p1: 50, p2: 25, p3: 25 } }), rent({ participants: ["p3"] })]) {
		const out = addDueRepeats([e], at(2027, 2, 5), new Set(["p3"]));
		assert.equal(out.length, 1);
		assert.equal(out[0].repeat, undefined);
	}
});

test("groups pass the members who left", () => {
	const group = { id: "g", name: "Flat", currency: { code: "INR", symbol: "₹", name: "Indian Rupee" }, members: [{ id: "p1", name: "Asha" }, { id: "p2", name: "Ben" }, { id: "p3", name: "Dev", left: true }], expenses: [rent()] };
	const [g] = addDueRepeatsToGroups([group], new Set(), at(2026, 11, 5));
	assert.deepEqual(g.expenses[1].participants, ["p1", "p2"]);
});
