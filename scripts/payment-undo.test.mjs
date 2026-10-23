// Tests for the one Undo shared by payments marked in a row.
//   node --test --experimental-strip-types scripts/payment-undo.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { nextPaymentUndo } = await import("../utils/paymentUndo.ts");

const first = nextPaymentUndo(null, undefined, "g1", ["p1"], 1);

test("the first payment gets its own Undo", () => {
	assert.deepEqual(first, { toastId: 1, groupId: "g1", ids: ["p1"] });
});

test("a second payment while that Undo shows takes both back", () => {
	assert.deepEqual(nextPaymentUndo(first, 1, "g1", ["p2"], 2).ids, ["p1", "p2"]);
});

test("Mark all paid joins too", () => {
	assert.deepEqual(nextPaymentUndo(first, 1, "g1", ["p2", "p3"], 2).ids, ["p1", "p2", "p3"]);
});

test("once that Undo is gone, a new payment starts fresh", () => {
	assert.deepEqual(nextPaymentUndo(first, undefined, "g1", ["p2"], 2).ids, ["p2"]);
	assert.deepEqual(nextPaymentUndo(first, 9, "g1", ["p2"], 2).ids, ["p2"]);
});

test("a payment in another group starts fresh", () => {
	assert.deepEqual(nextPaymentUndo(first, 1, "g2", ["p2"], 2).ids, ["p2"]);
});
