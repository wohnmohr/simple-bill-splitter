// Tests for names people type: cleaned of characters that change how text around them shows, and kept apart when two match.
//   node --test --experimental-strip-types scripts/names.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { cleanText } = await import("../utils/text.ts");
const { shownMembers } = await import("../utils/identity.ts");
const { applyOp, emptyState, materialize } = await import("../utils/groupOps.ts");

test("bidi overrides and control characters are dropped, joiners and scripts kept", () => {
	assert.equal(cleanText("Ben‮", 40), "Ben");
	assert.equal(cleanText("A⁦sha⁩\n\tRao", 40), "A sha Rao");
	assert.equal(cleanText("चाय", 40), "चाय");
	assert.equal(cleanText("👨‍👩‍👧 family", 40), "👨‍👩‍👧 family");
	assert.equal(cleanText("عائشة", 40), "عائشة");
});

test("names are cut at whole characters", () => {
	assert.equal(cleanText(`${"x".repeat(39)}😀😀`, 40), `${"x".repeat(39)}😀`);
});

test("a name from another phone is cleaned too", () => {
	const state = emptyState();
	applyOp(state, { i: "o1", t: 1, k: "m", e: "p1", v: { name: "Ben‮" } });
	applyOp(state, { i: "o2", t: 2, k: "g", e: "name", v: "Goa‮ trip" });
	const g = materialize(state, { id: "g" });
	assert.equal(g.members[0].name, "Ben");
	assert.equal(g.name, "Goa trip");
});

test("two members with the same name are told apart on screen", () => {
	const members = [{ id: "a", name: "Dev" }, { id: "b", name: "Asha" }, { id: "c", name: "dev" }];
	assert.deepEqual(shownMembers({ members }).map((m) => m.name), ["Dev", "Asha", "dev (2)"]);
	// A nickname that matches someone's name counts too; nothing to change returns the same list.
	assert.deepEqual(shownMembers({ members, nicknames: { b: "Dev" } }).map((m) => m.name), ["Dev", "Dev (2)", "dev (3)"]);
	const plain = [{ id: "a", name: "Dev" }];
	assert.equal(shownMembers({ members: plain }), plain);
	assert.equal(shownMembers({ members: [{ id: "a", name: "Esha\u202e" }] })[0].name, "Esha");
});
