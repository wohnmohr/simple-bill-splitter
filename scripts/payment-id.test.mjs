// Tests for the shared id of a payment marked from Settle up.
//   node --test --experimental-strip-types scripts/payment-id.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { paymentId } = await import("../utils/ids.ts");
const { applyOp, diffGroup, emptyState, groupAsChanges, materialize } = await import("../utils/groupOps.ts");
const { calculateSettlements } = await import("../utils/calculations.ts");

const members = [{ id: "a", name: "Asha" }, { id: "b", name: "Ben" }, { id: "c", name: "Chitra" }];
const dinner = { id: "x1", amount: 900, paidBy: "a", participants: ["a", "b", "c"], splitMethod: "equally", createdAt: 1 };
const group = { id: "g", name: "Goa", currency: { code: "INR", symbol: "₹", name: "Indian Rupee" }, members, expenses: [dinner] };
const pay = (g, from, to, amount, at) => ({
	...g,
	expenses: [...g.expenses, { id: paymentId(g.expenses, from, to, amount), amount, paidBy: from, participants: [to], splitMethod: "equally", kind: "payment", createdAt: at }],
});

let clock = 1;
const apply = (state, changes, device) => changes.forEach((c) => applyOp(state, { ...c, i: `${device}${clock}`, t: clock++ }));

test("Ben's 'paid' and Asha's 'received' on two phones merge into one payment", () => {
	const state = emptyState();
	apply(state, groupAsChanges(group), "o");
	const seen = materialize(state, { id: "g" });
	apply(state, diffGroup(seen, pay(seen, "b", "a", 300, 10)), "A");
	apply(state, diffGroup(seen, pay(seen, "b", "a", 300, 11)), "B");
	const merged = materialize(state, { id: "g" });
	assert.equal(merged.expenses.filter((e) => e.kind === "payment").length, 1);
	assert.deepEqual(calculateSettlements(members, merged.expenses), [{ from: "c", to: "a", amount: 300 }]);
});

test("a later payment between the same two people is its own entry", () => {
	const once = pay(group, "b", "a", 300, 10);
	const again = { ...once, expenses: [...once.expenses, { ...dinner, id: "x2" }] };
	assert.notEqual(paymentId(again.expenses, "b", "a", 300), once.expenses[1].id);
	// ...even when it's paid back the other way.
	assert.notEqual(paymentId(once.expenses, "a", "b", 300), paymentId(group.expenses, "a", "b", 300));
});

test("other people's payments and expenses don't change the id", () => {
	const id = paymentId(group.expenses, "b", "a", 300);
	const busier = pay({ ...group, expenses: [...group.expenses, { ...dinner, id: "x3", participants: ["a", "c"] }] }, "c", "a", 300, 10);
	assert.equal(paymentId(busier.expenses, "b", "a", 300), id);
});

test("a different amount or direction is a different payment", () => {
	const id = paymentId(group.expenses, "b", "a", 300);
	assert.notEqual(paymentId(group.expenses, "b", "a", 299.99), id);
	assert.notEqual(paymentId(group.expenses, "a", "b", 300), id);
	assert.match(id, /^payment-[a-z0-9]{1,12}$/);
});
