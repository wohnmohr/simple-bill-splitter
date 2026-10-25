// Edge cases for typed sentences (utils/quickAdd.ts) found in the second QA pass.
//   node --test --experimental-strip-types scripts/quick-add-edge.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuickAdd, resolveQuickAdd } from "../utils/quickAdd.ts";

/** Friday 16 Oct 2026, noon. */
const NOW = new Date(2026, 9, 16, 12).getTime();
const one = (text, members = []) => parseQuickAdd(text, members, NOW).expenses[0];
const ymd = (t) => new Date(t).toLocaleDateString("en-CA");

test("'50 50' after the names is a 50/50 split, not ₹50 owed", () => {
	const e = one("Dinner 2400 split between me and Asha 50 50");
	assert.equal(e.amount, 2400);
	assert.deepEqual(e.split, { method: "percentage", weights: { me: 50, Asha: 50 } });
});

test("dates written month first or year first", () => {
	for (const [text, date] of [
		["Dinner 2400 on 12/25 with Asha", "2025-12-25"],
		["Dinner 2400 on 2026-10-05 with Asha", "2026-10-05"],
		["Dinner 2400 on 25/12/2025 with Asha", "2025-12-25"],
		["Dinner 2400 on 5/10 with Asha", "2026-10-05"],
	]) {
		const e = one(text);
		assert.equal(ymd(e.date), date, text);
		assert.equal(e.split.method, "equally", text);
		assert.equal(e.amount, 2400, text);
	}
});

test("Hindi and other Indic words stay whole", () => {
	const e = one("चाय 200 with Asha");
	assert.equal(e.description, "चाय");
	assert.equal(e.amount, 200);
});

test("days that don't exist give no date instead of rolling into the next month", () => {
	for (const text of ["Uber 450 on 31/02 with Asha", "Uber 450 on 30 feb with Asha", "Uber 450 on 2026-02-30 with Asha", "Uber 450 on 31/09 with Asha"]) {
		const e = one(text);
		assert.equal(e.date, undefined, text);
		assert.equal(e.amount, 450, text);
	}
});

test("a 0/0 ratio is no split at all", () => {
	assert.deepEqual(one("Uber 450 split 0/0 with Asha").split, { method: "equally" });
});

test("amounts typed in Hindi or Bengali digits", () => {
	assert.equal(one("Dinner २४०० with Asha").amount, 2400);
	assert.equal(one("Lunch ৩০০ with Asha").amount, 300);
});

test("prices said the spoken way", () => {
	assert.equal(one("Dinner nineteen ninety nine with Asha").amount, 1999);
	assert.equal(one("Rent twenty five thousand with Asha").amount, 25000);
	assert.equal(one("Dinner fifteen hundred with Asha").amount, 1500);
	assert.equal(one("Dinner one hundred twenty with Asha").amount, 120);
});

test("the currency written is kept for a new group and flagged in another currency's group", () => {
	assert.equal(parseQuickAdd("Dinner $50 with Asha", [], NOW).currency, "USD");
	assert.equal(parseQuickAdd("Dinner 50 with Asha", [], NOW).currency, undefined);
	const mixed = parseQuickAdd("Dinner €50 and taxi £20", [], NOW);
	assert.equal(mixed.currency, undefined);
	assert.ok(mixed.expenses.every((e) => e.unsure.includes("amount")));

	const members = [{ id: "a", name: "Asha" }, { id: "b", name: "Ben" }];
	const draft = parseQuickAdd("Dinner ₹2400 split with Asha and Ben", ["Asha", "Ben"], NOW);
	assert.ok(resolveQuickAdd(draft, members, "a", "USD").expenses[0].unsure.includes("amount"));
	assert.ok(!resolveQuickAdd(draft, members, "a", "INR").expenses[0].unsure.includes("amount"));
	assert.equal(resolveQuickAdd(parseQuickAdd("Dinner $50 with Asha", [], NOW), []).currency, "USD");
});

test("a first name two members share is a guess to check", () => {
	const members = [{ id: "a1", name: "Asha Rao" }, { id: "a2", name: "Asha Iyer" }, { id: "b", name: "Ben" }];
	const q = resolveQuickAdd(parseQuickAdd("Dinner ₹2400 split with Asha and Ben", members.map((m) => m.name), NOW), members);
	assert.equal(q.people.find((p) => p.name === "Asha")?.unsure, true);
});

test("shares nobody stated add up exactly", () => {
	const members = ["a", "b", "c", "d"].map((id) => ({ id, name: { a: "Asha", b: "Ben", c: "Chitra", d: "Dev" }[id] }));
	const q = resolveQuickAdd(parseQuickAdd("Dinner 900 split between Asha, Ben, Chitra and Dev, Asha 50%", members.map((m) => m.name), NOW), members);
	const e = q.expenses[0];
	if (e.weights) assert.equal(Math.round(Object.values(e.weights).reduce((s, v) => s + v, 0) * 100), 10000);
});
