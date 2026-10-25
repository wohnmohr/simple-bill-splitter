// Tests for removing a member: their past entries stay, on this device and everyone else's.
//   node --test --experimental-strip-types scripts/remove-member.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { bringBack, currentMembers, entriesWith, removeMember } = await import("../utils/members.ts");
const { calculateBalances } = await import("../utils/calculations.ts");
const { applyOp, diffGroup, emptyState, groupAsChanges, materialize } = await import("../utils/groupOps.ts");

const dinner = { id: "e1", amount: 900, paidBy: "p1", participants: ["p1", "p2", "p3"], splitMethod: "equally" };
const cab = { id: "e2", amount: 600, paidBy: "p1", payers: { p1: 300, p3: 300 }, participants: ["p1"], splitMethod: "equally" };
const group = {
	id: "g",
	name: "Goa trip",
	currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
	members: [{ id: "p1", name: "Priya" }, { id: "p2", name: "Ben" }, { id: "p3", name: "Kabir" }, { id: "p4", name: "Typo" }],
	expenses: [dinner, cab],
};

test("someone on past entries is marked as left, and every entry stays", () => {
	const after = removeMember(group, "p2");
	assert.deepEqual(after.expenses, group.expenses);
	assert.deepEqual(after.members.find((m) => m.id === "p2"), { id: "p2", name: "Ben", left: true });
	assert.deepEqual(calculateBalances(after.members, after.expenses), calculateBalances(group.members, group.expenses));
	assert.deepEqual(currentMembers(after.members).map((m) => m.id), ["p1", "p3", "p4"]);
});

test("being one of several payers counts as being on the entry", () => {
	assert.equal(entriesWith(group.expenses, "p3"), 2);
	assert.equal(removeMember(group, "p3").members.find((m) => m.id === "p3").left, true);
});

test("someone on no entry is removed outright", () => {
	assert.equal(entriesWith(group.expenses, "p4"), 0);
	assert.deepEqual(removeMember(group, "p4").members.map((m) => m.id), ["p1", "p2", "p3"]);
});

test("bringing someone back puts them on new expenses again", () => {
	const back = bringBack(removeMember(group, "p2"), "p2");
	assert.deepEqual(back.members, group.members);
});

test("removing someone syncs as one member change and never deletes an entry", () => {
	const changes = diffGroup(group, removeMember(group, "p2"));
	assert.deepEqual(changes, [{ k: "m", e: "p2", v: { name: "Ben", left: true }, f: ["left"] }]);

	const state = emptyState();
	let t = 0;
	for (const c of [...groupAsChanges(group), ...changes]) applyOp(state, { ...c, i: `o${++t}`, t });
	const other = materialize(state, { id: "g" });
	assert.deepEqual(other.expenses.map((e) => e.id), ["e1", "e2"]);
	assert.deepEqual(other.members.find((m) => m.id === "p2"), { id: "p2", name: "Ben", left: true });
});
