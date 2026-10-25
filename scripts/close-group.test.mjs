// Tests for closing a finished group: its summary and how "closed" syncs.
//   node --test --experimental-strip-types scripts/close-group.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { groupSummary } = await import("../utils/calculations.ts");
const { applyOp, diffGroup, emptyState, groupAsChanges, materialize } = await import("../utils/groupOps.ts");

const day = (d) => new Date(2026, 9, d, 12).getTime();
const spend = (amount, d, kind) => ({ id: `e${amount}`, amount, paidBy: "p1", participants: ["p1", "p2"], splitMethod: "equally", createdAt: day(d), ...(kind ? { kind } : {}) });

test("the summary counts spending, not repayments", () => {
	const expenses = [spend(6000, 10), spend(2000, 12), spend(4000, 13, "payment")];
	assert.deepEqual(groupSummary(expenses), { total: 8000, count: 2, days: 3, sharers: 2, perPerson: 4000 });
	assert.deepEqual(groupSummary([]), { total: 0, count: 0, days: 0, sharers: 0, perPerson: 0 });
	// Someone on no expense (added after closing, say) doesn't bring "each" down.
	assert.equal(groupSummary([spend(900, 10)]).perPerson, 450);
});

const base = { id: "g", name: "Goa trip", currency: { code: "INR", symbol: "₹", name: "Indian Rupee" }, members: [{ id: "p1", name: "Priya" }], expenses: [] };

test("closing and reopening are one shared change each", () => {
	assert.deepEqual(diffGroup(base, { ...base, closedAt: 5 }), [{ k: "g", e: "closed", v: 5 }]);
	assert.deepEqual(diffGroup({ ...base, closedAt: 5 }, base), [{ k: "g", e: "closed", v: null }]);
});

test("a closed, themed group arrives closed and themed on other devices", () => {
	const state = emptyState();
	let t = 0;
	for (const c of groupAsChanges({ ...base, closedAt: 5, theme: "ocean" })) applyOp(state, { ...c, i: `o${++t}`, t });
	const g = materialize(state, { id: "g" });
	assert.equal(g.closedAt, 5);
	assert.equal(g.theme, "ocean");
});

test("a nonsense closed value is ignored", () => {
	const state = emptyState();
	applyOp(state, { i: "o1", t: 1, k: "g", e: "closed", v: "yesterday" });
	assert.equal(materialize(state, { id: "g" }).closedAt, undefined);
});
