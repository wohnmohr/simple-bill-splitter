// Tests for utils/quickAddHandoff.ts: a sentence typed on the home page reaches the dashboard once.
//   node --test --experimental-strip-types scripts/quick-add-handoff.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { handOffQuickAdd, takeQuickAdd } from "../utils/quickAddHandoff.ts";

test("the dashboard takes the sentence once", () => {
	const store = new Map();
	globalThis.window = { sessionStorage: { setItem: (k, v) => store.set(k, v), getItem: (k) => store.get(k) ?? null, removeItem: (k) => store.delete(k) } };
	handOffQuickAdd("Dinner 2400 split with Asha");
	assert.equal(takeQuickAdd(), "Dinner 2400 split with Asha");
	assert.equal(takeQuickAdd(), null);
	delete globalThis.window;
});

test("no storage: nothing to take", () => {
	assert.equal(takeQuickAdd(), null);
});
