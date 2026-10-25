// Tests for two phones editing the same expense or member before either has seen the other's change.
//   node --test --experimental-strip-types scripts/concurrent-edits.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { applyOp, cloneState, diffGroup, emptyState, groupAsChanges, materialize, maxClock, mergeState } = await import("../utils/groupOps.ts");

const group = {
	id: "g",
	name: "Goa trip",
	currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
	members: [{ id: "p1", name: "Asha" }, { id: "p2", name: "Ben" }, { id: "p3", name: "Kabir" }],
	expenses: [
		{ id: "e1", description: "Cab", amount: 900, paidBy: "p1", participants: ["p1", "p2", "p3"], splitMethod: "equally" },
		{ id: "e2", description: "Chai", amount: 300, paidBy: "p2", participants: ["p1", "p2"], splitMethod: "equally" },
	],
};

let clock = 0;
const stamp = (changes) => changes.map((c) => ({ ...c, i: `o${++clock}`, t: clock }));
const start = () => {
	clock = 0;
	const state = emptyState();
	const ops = stamp(groupAsChanges(group));
	for (const op of ops) applyOp(state, op);
	return { state, ops };
};
const view = (state) => materialize(state, { id: "g" });
/** One phone's edit to the group as it last saw it. */
const edit = (state, change) => {
	const before = view(state);
	return stamp(diffGroup(before, change(before)));
};
const setExpense = (id, patch) => (g) => ({ ...g, expenses: g.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
const setMember = (id, patch) => (g) => ({ ...g, members: g.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
/** Both phones end up with every op, each in its own order. */
const both = (state, a, b) => {
	const one = cloneState(state);
	const two = cloneState(state);
	for (const op of [...a, ...b]) applyOp(one, op);
	for (const op of [...b, ...a]) applyOp(two, op);
	assert.deepEqual(view(one), view(two));
	return one;
};

test("one phone fixes the amount, the other the description: both changes stay", () => {
	const { state } = start();
	const a = edit(state, setExpense("e1", { amount: 1200 }));
	const b = edit(state, setExpense("e1", { description: "Airport cab" }));
	const cab = view(both(state, a, b)).expenses.find((x) => x.id === "e1");
	assert.equal(cab.amount, 1200);
	assert.equal(cab.description, "Airport cab");
});

test("one phone adds Ben's UPI ID while Ben renames himself: both stay", () => {
	const { state } = start();
	const a = edit(state, setMember("p2", { upiId: "ben@testupi" }));
	const b = edit(state, setMember("p2", { name: "Benny" }));
	assert.deepEqual(view(both(state, a, b)).members[1], { id: "p2", name: "Benny", upiId: "ben@testupi" });
});

test("a cleared field merges too", () => {
	const { state } = start();
	for (const op of edit(state, setMember("p2", { upiId: "ben@testupi" }))) applyOp(state, op);
	const a = edit(state, (g) => ({ ...g, members: g.members.map((m) => (m.id === "p2" ? { id: "p2", name: "Ben" } : m)) }));
	const b = edit(state, setMember("p2", { name: "Benny" }));
	assert.deepEqual(view(both(state, a, b)).members[1], { id: "p2", name: "Benny" });
});

test("the same field edited on both phones: the later edit wins", () => {
	const { state } = start();
	const a = edit(state, setExpense("e1", { amount: 1200 }));
	const b = edit(state, setExpense("e1", { amount: 1500 }));
	assert.equal(view(both(state, a, b)).expenses[0].amount, 1500);
});

test("amount and split merge as one, so the split always adds up", () => {
	const { state } = start();
	const a = edit(state, setExpense("e1", { amount: 1200 }));
	const b = edit(state, setExpense("e1", { splitMethod: "exact", amounts: { p1: 300, p2: 300, p3: 300 } }));
	const cab = view(both(state, a, b)).expenses[0];
	assert.equal(cab.amount, 900);
	assert.deepEqual(cab.amounts, { p1: 300, p2: 300, p3: 300 });
});

test("an edit still carries the whole value, which older app versions read", () => {
	const { state } = start();
	const [op] = edit(state, setExpense("e1", { description: "Airport cab" }));
	assert.deepEqual(op.f, ["description"]);
	assert.deepEqual(op.v, { description: "Airport cab", amount: 900, paidBy: "p1", participants: ["p1", "p2", "p3"], splitMethod: "equally" });
});

test("a whole write from an older app version replaces older field edits but not newer ones", () => {
	const { state } = start();
	const [amount] = edit(state, setExpense("e1", { amount: 1200 }));
	const [old] = stamp([{ k: "e", e: "e1", v: { ...group.expenses[0], id: undefined, description: "Taxi" } }]);
	const [description] = edit(state, setExpense("e1", { description: "Airport cab" }));
	for (const order of [[amount, old, description], [description, old, amount], [old, description, amount]]) {
		const s = cloneState(state);
		for (const op of order) applyOp(s, op);
		assert.deepEqual([view(s).expenses[0].amount, view(s).expenses[0].description], [900, "Airport cab"]);
	}
});

test("a snapshot keeps field edits: merged in any order it gives the same group, and older apps read the merged value", () => {
	const { state, ops } = start();
	const a = edit(state, setExpense("e1", { amount: 1200 }));
	const b = edit(state, setExpense("e1", { description: "Airport cab" }));
	const snap = both(state, a, b);
	const snapshot = JSON.parse(JSON.stringify(snap));
	assert.equal(snapshot.e.e1.v.amount, 1200);
	assert.equal(snapshot.e.e1.v.description, "Airport cab");

	const fresh = emptyState();
	mergeState(fresh, snapshot);
	assert.deepEqual(view(fresh), view(snap));
	const behind = emptyState();
	for (const op of [...ops, ...b]) applyOp(behind, op);
	mergeState(behind, snapshot);
	assert.deepEqual(view(behind), view(snap));
	assert.equal(maxClock(fresh), clock);
});

test("an edit doesn't bring back an expense deleted on another phone, but undoing the delete does", () => {
	const { state } = start();
	const del = edit(state, (g) => ({ ...g, expenses: g.expenses.filter((x) => x.id !== "e2") }));
	const change = edit(state, setExpense("e2", { amount: 450 }));
	const after = both(state, del, change);
	assert.deepEqual(view(after).expenses.map((x) => x.id), ["e1"]);
	const undo = stamp(diffGroup(view(after), { ...view(after), expenses: [...view(after).expenses, { ...group.expenses[1], amount: 450 }] }));
	for (const op of undo) applyOp(after, op);
	assert.equal(view(after).expenses.find((x) => x.id === "e2").amount, 450);
});

test("field edits in a snapshot are checked like any other untrusted input", () => {
	const { state } = start();
	const before = view(state);
	const f = JSON.parse('{"__proto__": {"t": 100, "i": "y", "v": {"amount": 5}}, "description": {"t": "late", "i": "z", "v": {"description": "x"}}}');
	mergeState(state, { e: { e1: { t: 1, i: "a", v: { amount: 1 }, c: 1, f } } });
	assert.equal(state.e.e1.f, undefined);
	assert.deepEqual(view(state), before);
});
