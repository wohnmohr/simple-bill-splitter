// Tests for an op whose clock is far in the future (a broken or hostile device).
//   node --test --experimental-strip-types scripts/clock-poison.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { applyOp, applyOps, emptyState, materialize, maxClock, mergeState, nextClock, repairClocks } = await import("../utils/groupOps.ts");

const asha = { i: "o1", t: 1000, k: "m", e: "p1", v: { name: "Asha", upiId: "asha@okaxis" } };
const ben = { i: "o2", t: 1001, k: "m", e: "p2", v: { name: "Ben" } };
const evil = [
	{ i: "zz1", t: Number.MAX_SAFE_INTEGER, k: "m", e: "p1", v: { name: "Asha", upiId: "mal@ybl" }, f: ["upiId"] },
	{ i: "zz2", t: Number.MAX_SAFE_INTEGER, k: "g", e: "junk", v: 1 },
];
const start = () => {
	const state = emptyState();
	applyOps(state, [asha, ben]);
	return state;
};
const upi = (state) => materialize(state, { id: "g" }).members.find((m) => m.id === "p1").upiId;
/** A device's next edits, stamped the way groupSync does. */
const stamp = (state, changes) => {
	let t = Math.max(Date.now(), nextClock(state, []) + 1);
	return changes.map((c, n) => ({ ...c, i: `h${n}`, t: t++ }));
};
const fix = { k: "m", e: "p1", v: { name: "Asha", upiId: "asha@oksbi" }, f: ["upiId"] };
const cab = { k: "e", e: "e1", v: { amount: 300, paidBy: "p1", participants: ["p1", "p2"], splitMethod: "equally" } };

test("a far-future op can't win, and later edits still reach every device", () => {
	const a = start();
	const b = start();
	applyOps(a, evil);
	applyOps(b, evil);
	assert.equal(upi(b), "asha@okaxis");
	assert.ok(maxClock(a) <= Date.now() + 8 * 864e5);
	const ops = stamp(a, [fix, cab]);
	assert.ok(ops.every((o) => Number.isSafeInteger(o.t)));
	applyOps(b, JSON.parse(JSON.stringify(ops)));
	assert.equal(upi(b), "asha@oksbi");
	assert.equal(materialize(b, { id: "g" }).expenses.length, 1);
});

test("a far-future cell in a snapshot can't win either", () => {
	const poisoned = start();
	for (const op of evil) applyOp(poisoned, op);
	const b = start();
	mergeState(b, JSON.parse(JSON.stringify(poisoned)));
	assert.equal(upi(b), "asha@okaxis");
});

test("a device that already took a far-future op recovers", () => {
	const old = start();
	for (const op of evil) applyOp(old, op);
	// The old app stamped its next edit past safe integers; peers now take it, sorted last.
	const lost = { ...cab, i: "x1", t: Number.MAX_SAFE_INTEGER + 1 };
	applyOp(old, lost);
	const b = start();
	applyOps(b, [lost]);
	assert.equal(materialize(b, { id: "g" }).expenses.length, 1);

	assert.ok(Number.isSafeInteger(nextClock(old, [lost]) + 1));
	const fixed = repairClocks(JSON.parse(JSON.stringify(old)));
	assert.equal(materialize(fixed, { id: "g" }).members.length, 2);
	assert.equal(materialize(fixed, { id: "g" }).expenses.length, 1);
	applyOps(fixed, stamp(fixed, [fix]));
	assert.equal(upi(fixed), "asha@oksbi");
});

test("normal clocks are left alone", () => {
	const state = start();
	assert.equal(repairClocks(state), state);
	const soon = { ...cab, i: "s1", t: Date.now() + 864e5 };
	applyOps(state, [soon]);
	assert.equal(state.e.e1.t, soon.t);
	assert.equal(nextClock(state, []), soon.t);
});
