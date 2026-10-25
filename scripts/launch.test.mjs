// Tests for which group the "Add expense" shortcut and shared screenshots open.
//   node --test --experimental-strip-types scripts/launch.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { latestGroup } = await import("../utils/launch.ts");

const group = (id, ...dates) => ({ id, members: [{ id: "p1", name: "Asha" }], expenses: dates.map((createdAt, i) => ({ id: `${id}${i}`, createdAt })) });

test("opens the group with the newest expense", () => {
	assert.equal(latestGroup([group("a", 5, 9), group("b", 7), group("c")]).id, "a");
});

test("skips closed groups, and without dates picks the newest group", () => {
	assert.equal(latestGroup([{ ...group("a", 9), closedAt: 1 }, group("b", 3)]).id, "b");
	assert.equal(latestGroup([group("a"), group("b")]).id, "b");
	assert.equal(latestGroup([]), undefined);
});

test("skips groups with nobody to add an expense for", () => {
	assert.equal(latestGroup([group("a", 1), { ...group("b"), members: [] }]).id, "a");
	assert.equal(latestGroup([group("a", 1), { ...group("b", 9), members: [{ id: "p1", name: "Asha", left: true }] }]).id, "a");
});
