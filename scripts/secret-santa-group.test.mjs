// Tests for turning a Secret Santa into a group for the party's costs (utils/secretSanta.ts).
//   node --test --experimental-strip-types scripts/secret-santa-group.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { santaGroup } = await import("../utils/secretSanta.ts");

test("the organiser's draw becomes a group with everyone in it and nothing spent yet", () => {
	const { snapshot, meId } = santaGroup("Office Secret Santa", ["Asha", "Rohan", "Meera"]);
	assert.equal(snapshot.name, "Office Secret Santa");
	assert.deepEqual(snapshot.members.map((m) => m.name), ["Asha", "Rohan", "Meera"]);
	assert.deepEqual(snapshot.expenses, []);
	assert.equal(meId, undefined); // the app asks "Which one are you?" when they invite
});

test("someone opening their reveal link starts the group as themselves", () => {
	const { snapshot, meId } = santaGroup("Family Santa", ["Rohan"], "Rohan");
	assert.equal(meId, "p1");
	assert.equal(snapshot.members[0].name, "Rohan");
});

test("names and the event are cleaned like any other group, and a blank event gets a name", () => {
	const { snapshot } = santaGroup("  ", ["  Asha ‮", "", "Dev"]);
	assert.equal(snapshot.name, "Secret Santa");
	assert.deepEqual(snapshot.members.map((m) => m.name), ["Asha", "Dev"]);
});
