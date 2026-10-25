// Tests that shares, balances and settlements add up to the cent.
//   node --test --experimental-strip-types scripts/money-rounding.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
register("./fixtures/alias.mjs", import.meta.url);
const { calculateBalances, calculateSettlements, expenseShares } = await import("../utils/calculations.ts");

const people = ["a", "b", "c", "d"].map((id) => ({ id, name: id.toUpperCase() }));
const expense = (id, amount, paidBy, participants, extra = {}) => ({ id, amount, paidBy, participants, splitMethod: "equally", ...extra });

/** Records every suggested settlement as a payment, the way Mark all paid does. */
const markAllPaid = (expenses) => [
	...expenses,
	...calculateSettlements(people, expenses).map((s, i) => expense(`pay${i}`, s.amount, s.from, [s.to], { kind: "payment" })),
];

const balanceSum = (expenses) => calculateBalances(people, expenses).reduce((sum, b) => sum + Math.round(b.balance * 100), 0);
const assertSettled = (expenses) => {
	assert.deepEqual(calculateSettlements(people, expenses), []);
	for (const b of calculateBalances(people, expenses)) assert.ok(b.balance === 0, `${b.personId} is left with ${b.balance}`);
};

test("₹100 split three ways: shares add up and balances add up to zero", () => {
	const thirds = [expense("e1", 100, "a", ["a", "b", "c"])];
	assert.deepEqual([...expenseShares(thirds[0]).values()], [33.33, 33.33, 33.34]);
	assert.equal(balanceSum(thirds), 0);
	assertSettled(markAllPaid(thirds));
});

test("Coorg: chai and lunch split four ways, Mark all paid leaves nothing", () => {
	const coorg = [expense("chai", 10, "a", ["a", "b", "c", "d"]), expense("lunch", 150.5, "b", ["a", "b", "c", "d"])];
	assertSettled(markAllPaid(coorg));
});

test("₹0.01 split four ways doesn't leave the payer getting back a paisa", () => {
	assert.equal(balanceSum([expense("e1", 0.01, "a", ["a", "b", "c", "d"])]), 0);
});

test("several payers whose parts are a paisa off the amount still balance", () => {
	const shared = [expense("e1", 100, "a", ["a", "b", "c"], { payers: { a: 66.67, b: 33.34 } })];
	assert.equal(balanceSum(shared), 0);
	assertSettled(markAllPaid(shared));
});

test("random groups always settle to exactly zero after Mark all paid", () => {
	let seed = 42;
	const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
	const pick = (n) => Math.floor(rand() * n);
	for (let g = 0; g < 500; g++) {
		const expenses = Array.from({ length: 1 + pick(6) }, (_, i) => {
			const participants = people.map((p) => p.id).filter(() => rand() < 0.7);
			if (participants.length === 0) participants.push("a");
			const weights = Object.fromEntries(participants.map((id) => [id, 1 + pick(5)]));
			const split = [{}, { splitMethod: "percentage", percentages: weights }, { splitMethod: "exact", amounts: weights }][pick(3)];
			return expense(`e${i}`, (1 + pick(50000)) / 100, people[pick(4)].id, participants, split);
		});
		assert.equal(balanceSum(expenses), 0, `group ${g}`);
		assertSettled(markAllPaid(expenses));
	}
});

test("yen are shared out and settled in whole yen", () => {
	const yen = 1;
	const dinner = [expense("e1", 1000, "a", ["a", "b", "c"])];
	assert.deepEqual([...expenseShares(dinner[0], yen).values()], [333, 333, 334]);
	const settlements = calculateSettlements(people, dinner, yen);
	assert.deepEqual(settlements.map((s) => s.amount).sort(), [333, 334]);
	assert.equal(calculateBalances(people, dinner, yen).find((b) => b.personId === "a").balance, 667);
	// ¥1 between three: nobody owes a fraction of a yen.
	const coin = calculateSettlements(people, [expense("e2", 1, "a", ["a", "b", "c"])], yen);
	assert.deepEqual(coin, [{ from: "c", to: "a", amount: 1 }]);
});

test("amounts are written the way each currency is", async () => {
	const { formatCurrency } = await import("../utils/formatting.ts");
	const { CURRENCIES } = await import("../constants/index.ts");
	const [inr, usd, , , jpy] = CURRENCIES;
	assert.equal(formatCurrency(125000, inr), "₹1,25,000");
	assert.equal(formatCurrency(33.333, inr), "₹33.33");
	assert.equal(formatCurrency(100.001, inr), "₹100");
	assert.equal(formatCurrency(1250, usd), "$1,250.00");
	assert.equal(formatCurrency(100000, jpy), "¥100,000");
	assert.equal(formatCurrency(333.33, jpy), "¥333");
});
