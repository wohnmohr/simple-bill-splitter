// Tests for utils/quickAddSuggest.ts: what the quick-add box offers while typing.
//   node --test --experimental-strip-types scripts/quick-add-suggest.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { quickAddTemplates, suggestQuickAdd } from "../utils/quickAddSuggest.ts";
import { parseQuickAdd } from "../utils/quickAdd.ts";

const members = ["Asha Rao", "Ben", "Kiran"];
const labels = (text, names = members) => suggestQuickAdd(text, names).map((s) => s.label);

test("after an amount, the usual next steps", () => {
	assert.deepEqual(labels("Dinner 2400 "), ["split with", "paid by", "monthly"]);
	assert.deepEqual(labels("Rent 30k "), ["split with", "paid by", "monthly"]);
	assert.deepEqual(labels("Dinner 2400 split with Ben "), []);
});

test("after with, between or paid by: people not named yet", () => {
	assert.deepEqual(labels("Dinner 2400 split with "), ["me", "Asha Rao", "Ben"]);
	assert.deepEqual(labels("Dinner 2400 split with Ben and "), ["me", "Asha Rao", "Kiran"]);
	assert.deepEqual(labels("Dinner 2400 paid by ", []), ["me"]);
	assert.deepEqual(labels("Cab 400 split between ", []), ["me", "everyone"]);
});

test("a started name is finished", () => {
	const [s] = suggestQuickAdd("Dinner 2400 split with as", members);
	assert.deepEqual(s, { label: "Asha Rao", text: "Dinner 2400 split with Asha Rao " });
	assert.deepEqual(labels("Dinn"), [], "only names are completed, and only where a name goes");
});

test("nothing to offer mid-word or at the start", () => {
	assert.deepEqual(labels(""), []);
	assert.deepEqual(labels("Dinner"), []);
	assert.deepEqual(labels("Dinner 24"), []);
});

test("every template parses into expenses with an amount", () => {
	for (const { text } of [...quickAddTemplates([]), ...quickAddTemplates(members)]) {
		const { expenses } = parseQuickAdd(text, members);
		assert.ok(expenses.length && expenses.every((e) => e.amount > 0), text);
	}
	assert.equal(quickAddTemplates([])[0].label, "Trip", "a new group starts from a trip");
	assert.match(quickAddTemplates(members)[0].text, /Asha and Ben/, "uses the group's first names");
});
