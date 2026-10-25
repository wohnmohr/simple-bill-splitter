// Tests for the first-run form: the first expense makes the group, with you in it.
//   node --test --experimental-strip-types scripts/first-expense.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { splitNames, pastedNames, firstExpense } = await import("../utils/firstExpense.ts");
const { applyQuickAdd } = await import("../utils/quickAddSave.ts");

test("names split on commas and 'and', without blanks, repeats or you", () => {
	assert.deepEqual(splitNames("Riya, Kabir and  Meera S", ["Arjun"]), ["Riya", "Kabir", "Meera S"]);
	assert.deepEqual(splitNames("riya, Riya,, arjun & Dev", ["Arjun"]), ["riya", "Dev"]);
	assert.deepEqual(splitNames("Anand"), ["Anand"]);
	assert.deepEqual(splitNames(" , ", ["Arjun"]), []);
});

test("names already in the group, new lines and long names", () => {
	assert.deepEqual(splitNames("asha, Ben, Esha", ["Asha", "Ben", "Chitra"]), ["Esha"]);
	assert.deepEqual(splitNames("Farah\nGopal\n\nHari"), ["Farah", "Gopal", "Hari"]);
	// Cut to 40 characters before comparing, so a long name can't sneak in as a copy of yours.
	const me = "A".repeat(40);
	assert.deepEqual(splitNames("A".repeat(200), [me]), []);
	assert.deepEqual(pastedNames("Farah\r\nGopal\n\n Hari \n"), "Farah, Gopal, Hari");
	assert.equal(pastedNames("Farah, Gopal"), null);
});

test("the first expense becomes a group: you paid, everyone splits equally, you are its me", () => {
	const empty = { id: "g", name: "Dinner", currency: { code: "INR", symbol: "₹", name: "Indian Rupee" }, members: [], expenses: [] };
	const g = applyQuickAdd(empty, firstExpense({ amount: 1200, description: "Dinner", myName: "Arjun", others: ["Riya", "Kabir"] }), 5);
	assert.deepEqual(g.members.map((m) => m.name), ["Arjun", "Riya", "Kabir"]);
	const me = g.members[0];
	assert.equal(g.meId, me.id);
	assert.equal(me.joined, true);
	assert.equal(g.members[1].joined, undefined);
	assert.equal(g.expenses.length, 1);
	const [e] = g.expenses;
	assert.equal(e.amount, 1200);
	assert.equal(e.paidBy, me.id);
	assert.equal(e.description, "Dinner");
	assert.equal(e.createdAt, 5);
	assert.deepEqual(e.participants, g.members.map((m) => m.id));
});
