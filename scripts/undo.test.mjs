// Tests for Undo: it takes back only its own delete, and keeps everything done since.
//   node --test --experimental-strip-types scripts/undo.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { putBack, undoDeleteExpense, undoRemoveMember } = await import("../utils/undo.ts");
const { removeMember } = await import("../utils/members.ts");
const { diffGroup } = await import("../utils/groupOps.ts");

const dinner = { id: "e1", amount: 300, paidBy: "p1", participants: ["p1", "p2", "p3"], splitMethod: "equally", description: "Dinner" };
const taxi = { id: "e2", amount: 400, paidBy: "p2", participants: ["p1", "p2"], splitMethod: "equally", description: "Taxi" };
const hotel = { id: "e3", amount: 800, paidBy: "p1", participants: ["p1", "p2"], splitMethod: "equally", description: "Hotel" };
const cab = { id: "e4", amount: 450, paidBy: "p2", participants: ["p1", "p2"], splitMethod: "equally", description: "Cab" };
const group = {
	id: "g",
	name: "Goa trip",
	currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
	members: [{ id: "p1", name: "Asha" }, { id: "p2", name: "Ben" }, { id: "p3", name: "Dev" }, { id: "p4", name: "Typo" }],
	expenses: [dinner, taxi, hotel],
	comments: [{ id: "c1", expenseId: "e2", text: "Airport", at: 1 }, { id: "c2", expenseId: "e3", text: "2 nights", at: 2 }],
};
const deleted = (g, id) => ({ ...g, expenses: g.expenses.filter((e) => e.id !== id), comments: g.comments.filter((c) => c.expenseId !== id) });
const added = (g, e) => ({ ...g, expenses: [...g.expenses, e] });

test("putBack inserts at the old place, at the end if the list got shorter, and never twice", () => {
	assert.deepEqual(putBack([{ id: "a" }, { id: "c" }], { id: "b" }, 1), [{ id: "a" }, { id: "b" }, { id: "c" }]);
	assert.deepEqual(putBack([{ id: "a" }], { id: "b" }, 5), [{ id: "a" }, { id: "b" }]);
	const list = [{ id: "a" }, { id: "b" }];
	assert.equal(putBack(list, { id: "b" }, 0), list);
});

test("undoing an expense delete keeps an expense added since, and puts the deleted one back in its place with its comments", () => {
	const now = added(deleted(group, "e2"), cab);
	const undone = undoDeleteExpense(now, group, "e2");
	assert.deepEqual(undone.expenses.map((e) => e.id), ["e1", "e2", "e3", "e4"]);
	assert.deepEqual(undone.comments.map((c) => c.id), ["c1", "c2"]);
});

test("undoing a delete twice, or after the entry came back another way, changes nothing", () => {
	const undone = undoDeleteExpense(deleted(group, "e2"), group, "e2");
	assert.deepEqual(undoDeleteExpense(undone, group, "e2"), undone);
});

test("undoing a removal brings back someone marked as left, and keeps an expense added since", () => {
	const now = added(removeMember(group, "p3"), cab);
	assert.equal(now.members[2].left, true);
	const undone = undoRemoveMember(now, group, "p3");
	assert.deepEqual(undone.members, group.members);
	assert.deepEqual(undone.expenses.map((e) => e.id), ["e1", "e2", "e3", "e4"]);
});

test("undoing a removal puts someone removed outright back in their place", () => {
	const now = removeMember(group, "p4");
	assert.deepEqual(now.members.map((m) => m.id), ["p1", "p2", "p3"]);
	const renamed = { ...now, members: now.members.map((m) => (m.id === "p1" ? { ...m, name: "Asha K" } : m)) };
	assert.deepEqual(undoRemoveMember(renamed, group, "p4").members.map((m) => m.name), ["Asha K", "Ben", "Dev", "Typo"]);
});

test("undoing the removal of someone who had already left keeps them left", () => {
	const before = removeMember(group, "p3");
	assert.deepEqual(undoRemoveMember(removeMember(before, "p3"), before, "p3"), before);
});

test("an undo syncs as the one change it takes back, never touching what was added since", () => {
	const now = added(deleted(group, "e2"), cab);
	assert.deepEqual(diffGroup(now, undoDeleteExpense(now, group, "e2")).map((c) => `${c.k}:${c.e}`), ["e:e2", "c:c1"]);
	const left = added(removeMember(group, "p3"), cab);
	assert.deepEqual(diffGroup(left, undoRemoveMember(left, group, "p3")), [{ k: "m", e: "p3", v: { name: "Dev" } }]);
});
