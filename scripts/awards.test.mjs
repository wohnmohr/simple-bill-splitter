// Tests for group awards, award news and the settle streak.
//   node --test --experimental-strip-types scripts/awards.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { groupAwards, awardDetail, awardNews, holdersOf, settleStreak, paysOnTime } = await import("../utils/awards.ts");

const INR = { code: "INR", symbol: "₹", name: "Indian Rupee" };
const HOUR = 60 * 60 * 1000;
const T0 = new Date(2026, 9, 20, 12).getTime(); // local noon
const members = [{ id: "a", name: "Asha" }, { id: "b", name: "Bilal" }, { id: "c", name: "Chitra" }];
const ALL = ["a", "b", "c"];
let n = 0;
const spend = (paidBy, amount, at = T0, participants = ALL) => ({ id: `e${n++}`, amount, paidBy, participants, splitMethod: "equally", createdAt: at });
const pay = (from, to, amount, at) => ({ id: `p${n++}`, kind: "payment", amount, paidBy: from, participants: [to], splitMethod: "exact", createdAt: at });
const byId = (awards) => Object.fromEntries(awards.map((a) => [a.id, a.personId]));

test("each award goes to its top scorer, and nobody gets two", () => {
	const expenses = [spend("a", 9000), spend("b", 300), spend("b", 200), spend("b", 100), spend("c", 600)];
	const awards = groupAwards({ members, expenses });
	// Asha paid most; Bilal paid most often; Chitra is left with the biggest bill she paid.
	assert.deepEqual(byId(awards), { spender: "a", rounds: "b", bigBill: "c" });
	assert.equal(awards.find((a) => a.id === "spender").value, 9000);
});

test("everyone who shared in the spending gets something", () => {
	const expenses = [spend("a", 900), spend("a", 300)];
	const awards = groupAwards({ members, expenses });
	assert.deepEqual(new Set(awards.map((a) => a.personId)), new Set(ALL));
	assert.ok(awards.some((a) => a.id === "allIn" || a.id === "company"));
});

test("payments are not spending, and a member on no expense gets nothing", () => {
	const four = [...members, { id: "d", name: "Dev" }];
	const expenses = [spend("a", 300), pay("b", "a", 100, T0 + HOUR), pay("c", "a", 100, T0 + 3 * HOUR)];
	const awards = groupAwards({ members: four, expenses });
	assert.equal(awards.find((a) => a.id === "spender").personId, "a");
	assert.equal(awards.find((a) => a.id === "fastest").personId, "b");
	assert.ok(!awards.some((a) => a.personId === "d"));
});

test("no awards for a group of one or with no spending", () => {
	assert.deepEqual(groupAwards({ members, expenses: [] }), []);
	assert.deepEqual(groupAwards({ members, expenses: [spend("a", 100, T0, ["a"])] }), []);
});

test("night owl counts bills paid late at night", () => {
	const late = new Date(2026, 9, 20, 23, 30).getTime();
	const expenses = [spend("a", 900), spend("a", 800), spend("b", 100), spend("b", 100), spend("b", 100), spend("c", 50, late)];
	assert.equal(byId(groupAwards({ members, expenses })).nightOwl, "c");
});

test("details read naturally, and hide money when asked", () => {
	const [spender] = groupAwards({ members, expenses: [spend("a", 12500), spend("b", 10)] });
	assert.equal(awardDetail(spender, INR), "paid ₹12,500");
	assert.equal(awardDetail(spender, INR, false), "paid the most");
	assert.equal(awardDetail({ id: "rounds", value: 2 }, INR), "paid twice");
	assert.equal(awardDetail({ id: "fastest", value: 3 * HOUR }, INR), "paid back in 3 h");
	assert.equal(awardDetail({ id: "company", value: 1 }, INR), "in on 1 expense");
});

test("award news says when one of yours changed hands", () => {
	const before = holdersOf(groupAwards({ members, expenses: [spend("a", 500), spend("b", 100)] }));
	const after = groupAwards({ members, expenses: [spend("a", 500), spend("b", 100), spend("b", 900)] });
	assert.deepEqual(awardNews(before, after, "b"), { award: after[0], gained: true, other: "a" });
	assert.equal(awardNews(before, after, "a").gained, false);
	assert.equal(awardNews(before, after, "a").other, "b");
	assert.equal(awardNews(holdersOf(after), after, "a"), null);
});

test("settle streak counts on-time payments back to the first late one, across groups", () => {
	const g1 = { meId: "a", expenses: [spend("b", 300, T0), pay("a", "b", 100, T0 + 2 * HOUR), spend("b", 300, T0 + 50 * HOUR), pay("a", "b", 100, T0 + 100 * HOUR)] };
	const g2 = { meId: "a", expenses: [spend("c", 300, T0 + 200 * HOUR), pay("a", "c", 100, T0 + 201 * HOUR)] };
	assert.equal(settleStreak([g1]), 0); // latest payment came 50 h later
	assert.equal(settleStreak([g1, g2]), 1);
	assert.equal(settleStreak([g2, { meId: null, expenses: g1.expenses }]), 1);
	assert.equal(settleStreak([]), 0);
});

test("paying within a day of the last shared expense is on time", () => {
	const expenses = [spend("b", 300, T0)];
	assert.equal(paysOnTime(expenses, "a", T0 + 23 * HOUR), true);
	assert.equal(paysOnTime(expenses, "a", T0 + 25 * HOUR), false);
	assert.equal(paysOnTime([], "a", T0), false);
});
