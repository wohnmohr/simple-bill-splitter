// Tests for two tabs (or the installed app and a browser tab) open on one synced group.
//   node --test --experimental-strip-types scripts/two-tabs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { applyOp, diffGroup, emptyState, joinPending } = await import("../utils/groupOps.ts");

const op = (i, e, t) => ({ i, t, k: "e", e, v: { amount: 250 } });

test("both tabs' queued changes are kept, each once", () => {
	const milk = op("o1", "milk", 10);
	const bread = op("o2", "bread", 11);
	assert.deepEqual(joinPending(emptyState(), [bread], [milk, bread]), [bread, milk]);
});

test("a change the server confirmed in either tab is not sent again", () => {
	const state = emptyState();
	const milk = op("o1", "milk", 10);
	applyOp(state, milk);
	const bread = op("o2", "bread", 11);
	assert.deepEqual(joinPending(state, [bread], [milk]), [bread]);
	assert.deepEqual(joinPending(state, [milk, bread], []), [bread]);
});

test("a later edit of the same expense in the other tab still goes out", () => {
	const state = emptyState();
	applyOp(state, op("o1", "milk", 10));
	const edit = op("o2", "milk", 12);
	assert.deepEqual(joinPending(state, [], [edit]), [edit]);
});

test("taking in the other tab's screen leaves nothing to re-send; a stale screen would delete its expense", () => {
	const inr = { code: "INR", symbol: "₹", name: "Indian Rupee" };
	const stale = { id: "g", name: "Groceries", currency: inr, members: [{ id: "a", name: "Asha" }, { id: "b", name: "Ben" }], expenses: [] };
	const milk = { id: "milk", amount: 250, paidBy: "b", participants: ["a", "b"], splitMethod: "equally" };
	const fromOtherTab = { ...stale, expenses: [milk] };
	// Before: the stale tab renamed its own copy, and its copy replaced the other tab's.
	assert.deepEqual(diffGroup(fromOtherTab, { ...stale, name: "Flat groceries" }).map((c) => [c.e, c.v]), [["name", "Flat groceries"], ["milk", null]]);
	// After: the stale tab first takes in the other tab's groups, so its rename is the only change.
	assert.deepEqual(diffGroup(fromOtherTab, { ...fromOtherTab, name: "Flat groceries" }).map((c) => c.e), ["name"]);
});
