// Tests for splitting by shares (2:1:1).
//   node --test --experimental-strip-types scripts/shares.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
register("./fixtures/alias.mjs", import.meta.url);
const { calculateBalances, enteredWeights, sharesToAmounts, splitChoice, splitFields } = await import("../utils/calculations.ts");
const { applyOp, emptyState, groupAsChanges, materialize } = await import("../utils/groupOps.ts");

const people = [
	{ id: "p1", name: "Priya" },
	{ id: "p2", name: "Asha" },
	{ id: "p3", name: "Ben" },
];
const villa = (shares, amount = 4000) => ({
	id: "e1",
	amount,
	paidBy: "p1",
	participants: ["p1", "p2", "p3"],
	...splitFields("shares", shares, amount),
});

test("2:1:1 becomes exact amounts that add up", () => {
	assert.deepEqual(sharesToAmounts({ p1: 2, p2: 1, p3: 1 }, 4000), { p1: 2000, p2: 1000, p3: 1000 });
	const odd = sharesToAmounts({ p1: 1, p2: 1, p3: 1 }, 100);
	assert.deepEqual(odd, { p1: 33.33, p2: 33.33, p3: 33.34 });
	assert.equal(Object.values(odd).reduce((a, b) => a + b, 0).toFixed(2), "100.00");
});

test("someone with no share isn't charged", () => {
	assert.deepEqual(sharesToAmounts({ p1: 2, p2: 0, p3: 1 }, 300), { p1: 200, p3: 100 });
});

test("stored as an exact split, so older versions still add up", () => {
	const e = villa({ p1: 2, p2: 1, p3: 1 });
	assert.equal(e.splitMethod, "exact");
	assert.deepEqual(e.amounts, { p1: 2000, p2: 1000, p3: 1000 });
	assert.deepEqual(e.shares, { p1: 2, p2: 1, p3: 1 });
	// Priya paid 4000 and owes 2000; the others owe 1000 each.
	assert.deepEqual(calculateBalances(people, [e]).map((b) => b.balance), [2000, -1000, -1000]);
	// An older app sees only the amounts and gets the same balances.
	const { shares: _s, ...old } = e;
	assert.deepEqual(calculateBalances(people, [old]), calculateBalances(people, [e]));
});

test("editing shows the shares that were typed", () => {
	const e = villa({ p1: 2, p2: 1, p3: 1 });
	assert.equal(splitChoice(e), "shares");
	assert.deepEqual(enteredWeights(e), { p1: 2, p2: 1, p3: 1 });
	const exact = { ...e, shares: undefined };
	assert.equal(splitChoice(exact), "exact");
	assert.deepEqual(enteredWeights(exact), e.amounts);
});

test("other methods clear old shares", () => {
	assert.equal(splitFields("equally", undefined, 4000).shares, undefined);
	assert.equal(splitFields("exact", { p1: 4000 }, 4000).shares, undefined);
});

const synced = (expense) => {
	const state = emptyState();
	let t = 0;
	const group = { id: "g", name: "Goa trip", currency: { code: "INR", symbol: "₹", name: "Indian Rupee" }, members: people, expenses: [expense] };
	for (const c of groupAsChanges(group)) applyOp(state, { ...c, i: `o${++t}`, t });
	return materialize(state, { id: "g" }).expenses[0];
};

test("shares sync to other devices", () => {
	const e = villa({ p1: 2, p2: 1, p3: 1 });
	assert.deepEqual(synced(e).shares, e.shares);
	assert.deepEqual(synced(e).amounts, e.amounts);
});

test("bad shares are dropped, the amounts still count", () => {
	const e = villa({ p1: 2, p2: 1, p3: 1 });
	for (const shares of [{ p1: 2, p2: 1 }, { ...e.shares, p3: -1 }, { ...e.shares, p3: 1e9 }, "2:1:1"]) {
		const got = synced({ ...e, shares });
		assert.equal(got.shares, undefined);
		assert.deepEqual(got.amounts, e.amounts);
	}
	assert.equal(synced({ ...e, splitMethod: "percentage", percentages: { p1: 50, p2: 25, p3: 25 } }).shares, undefined);
});

const centsOf = (amounts) => Object.values(amounts).reduce((sum, a) => sum + Math.round(a * 100), 0);

test("amounts that don't divide evenly still add up to the paisa", () => {
	assert.deepEqual(sharesToAmounts({ p1: 2, p2: 1, p3: 1 }, 1.01), { p1: 0.51, p2: 0.25, p3: 0.25 });
	assert.deepEqual(sharesToAmounts({ p1: 2, p2: 1, p3: 1 }, 101), { p1: 50.5, p2: 25.25, p3: 25.25 });
	for (let paise = 1; paise <= 20000; paise++) {
		const amounts = sharesToAmounts({ p1: 2, p2: 1, p3: 1 }, paise / 100);
		assert.equal(centsOf(amounts), paise, `₹${paise / 100}`);
		assert.ok(Object.values(amounts).every((a) => a >= 0 && Math.abs(a * 100 - Math.round(a * 100)) < 1e-6));
	}
});

test("the same split survives a reload, another device and an edit", () => {
	const cases = [[{ p1: 2, p2: 1, p3: 1 }, 1.01], [{ p1: 2, p2: 1, p3: 1 }, 101], [{ p1: 1, p2: 1, p3: 1 }, 1]];
	for (const [shares, amount] of cases) {
		const e = villa(shares, amount);
		const reloaded = JSON.parse(JSON.stringify(e));
		const elsewhere = synced(reloaded);
		// Editing on the other device and saving without changes recalculates from the stored shares.
		const edited = { ...elsewhere, ...splitFields(splitChoice(elsewhere), enteredWeights(elsewhere), elsewhere.amount) };
		for (const copy of [reloaded, elsewhere, edited]) assert.deepEqual(copy.amounts, e.amounts, `₹${amount}`);
		assert.equal(centsOf(edited.amounts), Math.round(amount * 100));
	}
});
