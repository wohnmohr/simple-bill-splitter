// Tests for utils/quickAdd.ts: typed sentences into expenses.
//   node --test --experimental-strip-types scripts/quick-add.test.mjs
// Prints accuracy per field on fixtures/quick-add.mjs (the phrasings the rules
// were written against) and fixtures/quick-add-heldout.mjs (never tuned on).
import { test } from "node:test";
import assert from "node:assert/strict";
import cases from "./fixtures/quick-add.mjs";
import heldOut from "./fixtures/quick-add-heldout.mjs";
import { ME, NEW_ME, parseQuickAdd, resolveQuickAdd } from "../utils/quickAdd.ts";

const low = (s) => s.toLowerCase();
const sameNames = (a, b) => a.length === b.length && a.map(low).sort().join() === b.map(low).sort().join();
const sameWeights = (a, b) =>
	Object.keys(a).length === Object.keys(b).length &&
	Object.entries(b).every(([k, v]) => Object.entries(a).some(([k2, v2]) => low(k2) === low(k) && Math.abs(v2 - v) < 0.01));

const FIELDS = {
	amount: (got, want) => Math.abs(got.amount - want.amount) < 0.01,
	payer: (got, want) => low(got.payer) === low(want.payer),
	participants: (got, want) =>
		Array.isArray(want.participants)
			? Array.isArray(got.participants) && sameNames(got.participants, want.participants)
			: typeof want.participants === "object"
				? got.participants?.ways === want.participants.ways
				: got.participants === want.participants,
	split: (got, want) =>
		want.split === "equal"
			? got.split.method === "equally"
			: want.split.percent
				? got.split.method === "percentage" && sameWeights(got.split.weights, want.split.percent)
				: got.split.method === "exact" && sameWeights(got.split.weights, want.split.exact),
	description: (got, want) => low(got.description) === low(want.description),
	monthly: (got, want) => got.monthly === want.monthly,
};

/** Scores a set of cases; returns per-field and whole-input accuracy, and the misses. */
function score(set) {
	const right = Object.fromEntries([...Object.keys(FIELDS), "count", "group"].map((f) => [f, 0]));
	let total = 0;
	let whole = 0;
	const misses = [];
	for (const c of set) {
		const draft = parseQuickAdd(c.text);
		const wrong = [];
		if (draft.expenses.length === c.expenses.length) right.count++;
		else wrong.push("count");
		if ((draft.groupName ?? "").toLowerCase() === (c.group ?? "").toLowerCase()) right.group++;
		else wrong.push("group");
		c.expenses.forEach((want, i) => {
			const got = draft.expenses[i];
			total++;
			for (const [f, ok] of Object.entries(FIELDS)) {
				if (got && ok(got, want)) right[f]++;
				else if (!wrong.includes(f)) wrong.push(f);
			}
		});
		if (wrong.length) misses.push({ text: c.text, wrong, got: draft });
		else whole++;
	}
	const pct = (n, of) => Math.round((n / of) * 1000) / 10;
	return {
		inputs: set.length,
		fullyCorrect: pct(whole, set.length),
		fields: Object.fromEntries(Object.entries(right).map(([f, n]) => [f, pct(n, f === "count" || f === "group" ? set.length : total)])),
		misses,
	};
}

for (const [name, set] of [["phrasings", cases], ["held-out phrasings", heldOut]]) {
	test(`at least 90% of ${set.length} ${name} parse fully correctly`, () => {
		const result = score(set);
		console.log(JSON.stringify({ ...result, misses: result.misses.map((m) => `${m.text} [${m.wrong}]`) }, null, 1));
		assert.ok(result.fullyCorrect >= 90, `${result.fullyCorrect}% fully correct`);
	});
}

test("defaults are flagged, never silent", () => {
	const [e] = parseQuickAdd("Pizza 900").expenses;
	assert.deepEqual(e.unsure.sort(), ["participants", "payer"]);
	assert.deepEqual(parseQuickAdd("Asha paid 900 for pizza with Ben").expenses[0].unsure, []);
	assert.ok(parseQuickAdd("Goa: Asha 5000 hotel").expenses[0].unsure.includes("payer"), "a name read from capitals alone");
	assert.ok(parseQuickAdd("Gym 2000 weekly").expenses[0].unsure.includes("repeat"));
	assert.ok(parseQuickAdd("split with Ben").expenses[0].unsure.includes("amount"));
});

test("lowercase names are known once the group has them", () => {
	const [e] = parseQuickAdd("asha 450 auto", ["Asha"]).expenses;
	assert.equal(e.payer, "Asha");
	assert.deepEqual(e.unsure, ["participants"]);
});

const members = [
	{ id: "p1", name: "Asha Rao" },
	{ id: "p2", name: "Ben" },
	{ id: "p3", name: "Kiran" },
];

test("names match members by full or first name; new names are added", () => {
	const r = resolveQuickAdd(parseQuickAdd("Dinner 900 split between asha, Ben and Zoya"), members, "p3");
	const [e] = r.expenses;
	assert.equal(e.paidBy, "p3");
	assert.deepEqual(e.participants, ["p1", "p2", "new:zoya"]);
	assert.deepEqual(r.people.filter((p) => p.isNew).map((p) => p.name), ["Zoya"]);
});

test("everyone is the whole group; in a new group, everyone named plus me", () => {
	assert.deepEqual(resolveQuickAdd(parseQuickAdd("Cab 300 for everyone"), members, "p2").expenses[0].participants, ["p1", "p2", "p3"]);
	const r = resolveQuickAdd(parseQuickAdd("Goa: Asha 5000 hotel, Ben 1200 fuel, everyone equal"), []);
	assert.deepEqual(r.expenses[0].participants, ["new:asha", "new:ben", NEW_ME]);
	assert.ok(r.people.find((p) => p.key === NEW_ME).unsure, "asks the person typing for their name");
});

test("N ways uses the group when it has N people, else placeholders to rename", () => {
	assert.deepEqual(resolveQuickAdd(parseQuickAdd("rent 30k split 3 ways"), members, "p1").expenses[0].participants, ["p1", "p2", "p3"]);
	const r = resolveQuickAdd(parseQuickAdd("rent 30k split 3 ways"), []);
	assert.deepEqual(r.expenses[0].participants, [NEW_ME, "new:person 2", "new:person 3"]);
	assert.ok(r.expenses[0].unsure.includes("participants"));
});

test("shares nobody stated are split equally among the rest", () => {
	const [exact] = resolveQuickAdd(parseQuickAdd("Hotel 9000 split between me, Asha and Ben, Asha 4000"), members, "p3").expenses;
	assert.deepEqual(exact.weights, { p1: 4000, p3: 2500, p2: 2500 });
	const [pct] = resolveQuickAdd(parseQuickAdd("Party 10000 split with Ben and Kiran, Kiran pays 50%"), members, "p1").expenses;
	assert.deepEqual(pct.weights, { p3: 50, p1: 25, p2: 25 });
	const [over] = resolveQuickAdd(parseQuickAdd("Dinner 1000: Asha 700, Ben 500"), members, "p3").expenses;
	assert.ok(over.unsure.includes("split") || over.weights === undefined);
});

test("ME is a reserved name", () => assert.equal(ME, "me"));
