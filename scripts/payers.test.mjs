// Tests for expenses paid by more than one person.
//   node --test --experimental-strip-types scripts/payers.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateBalances, calculateSettlements, expensePayers, payerFields } from "../utils/calculations.ts";

const people = [
	{ id: "p1", name: "Priya" },
	{ id: "p2", name: "Asha" },
	{ id: "p3", name: "Ben" },
];
const dinner = {
	id: "e1",
	amount: 2400,
	paidBy: "p1",
	payers: { p1: 1500, p2: 900 },
	participants: ["p1", "p2", "p3"],
	splitMethod: "equally",
};
const balanceOf = (id, expenses) => calculateBalances(people, expenses).find((b) => b.personId === id).balance;

test("one payer is just paidBy", () => {
	assert.deepEqual(payerFields({ p2: 2400 }), { paidBy: "p2", payers: undefined });
	assert.deepEqual([...expensePayers({ ...dinner, payers: undefined })], [["p1", 2400]]);
});

test("several payers keep their parts, the biggest is paidBy", () => {
	assert.deepEqual(payerFields({ p2: 900, p1: 1500, p3: 0 }), { paidBy: "p1", payers: { p1: 1500, p2: 900 } });
});

test("each payer is credited with what they put in", () => {
	// Everyone's share is 800.
	assert.equal(balanceOf("p1", [dinner]), 700);
	assert.equal(balanceOf("p2", [dinner]), 100);
	assert.equal(balanceOf("p3", [dinner]), -800);
	assert.deepEqual(calculateSettlements(people, [dinner]), [
		{ from: "p3", to: "p1", amount: 700 },
		{ from: "p3", to: "p2", amount: 100 },
	]);
});
