// Tests for who recorded a payment (utils/formatting.ts recordedNote, utils/groupOps.ts toExpense).
//   node --test --experimental-strip-types scripts/recorded-note.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { recordedNote } = await import("../utils/formatting.ts");
const { toExpense } = await import("../utils/groupOps.ts");

const names = { p1: "Asha", p2: "Ben" };
const nameOf = (id) => names[id] ?? "Unknown";
const now = new Date(2026, 9, 30, 18, 0).getTime();

test("names you, or the member who recorded it", () => {
	assert.match(recordedNote({ recordedBy: "p1", createdAt: now }, "p1", nameOf, now), /^Recorded by you · /);
	assert.match(recordedNote({ recordedBy: "p2", createdAt: now }, "p1", nameOf, now), /^Recorded by Ben · /);
});

test("today shows the time, earlier days the date, old entries neither", () => {
	const today = recordedNote({ recordedBy: "p1", createdAt: new Date(2026, 9, 30, 15, 40).getTime() }, "p1", nameOf, now);
	assert.match(today, /3:40/);
	assert.equal(recordedNote({ createdAt: new Date(2026, 9, 28, 9, 0).getTime() }, "p1", nameOf, now), "Recorded · 28 Oct");
	assert.equal(recordedNote({}, "p1", nameOf, now), "Recorded");
});

test("sync keeps recordedBy only on payments, and only for a member", () => {
	const members = new Set(["p1", "p2"]);
	const base = { amount: 600, paidBy: "p1", participants: ["p2"], splitMethod: "equally" };
	assert.equal(toExpense("x", { ...base, kind: "payment", recordedBy: "p2" }, members).recordedBy, "p2");
	assert.equal(toExpense("x", { ...base, kind: "payment", recordedBy: "stranger" }, members).recordedBy, undefined);
	assert.equal(toExpense("x", { ...base, recordedBy: "p2" }, members).recordedBy, undefined);
});
