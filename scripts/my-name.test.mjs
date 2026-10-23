// Tests for filling in your remembered name in quick add.
//   node --test --experimental-strip-types scripts/my-name.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { withMyName } = await import("../utils/myName.ts");
const { NEW_ME, parseQuickAdd, resolveQuickAdd } = await import("../utils/quickAdd.ts");

const quick = (text, members = []) => resolveQuickAdd(parseQuickAdd(text, members.map((m) => m.name)), members);
const me = (q) => q.people.find((p) => p.key === NEW_ME);

test("names the 'you' quick add couldn't name", () => {
	const filled = withMyName(quick("I paid 900 for dinner with Riya and Kabir"), "Asha");
	assert.deepEqual(me(filled), { key: NEW_ME, name: "Asha", isNew: true, isMe: true, unsure: false });
});

test("leaves it alone with no saved name, or when the group already has someone by that name", () => {
	const q = quick("I paid 900 for dinner with Riya");
	assert.equal(withMyName(q, ""), q);
	const inGroup = quick("I paid 900 for dinner with Riya", [{ id: "p1", name: "Asha" }, { id: "p2", name: "Riya" }]);
	assert.equal(withMyName(inGroup, "asha"), inGroup);
});
