// Tests for removing yourself: "you" is cleared, here or by another device, so who you are is asked again.
//   node --test --experimental-strip-types scripts/remove-yourself.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { meAfter, removeMember } = await import("../utils/members.ts");

const dinner = { id: "e1", amount: 900, paidBy: "p1", participants: ["p1", "p2", "p3"], splitMethod: "equally" };
const group = {
	id: "g",
	name: "Goa trip",
	currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
	members: [{ id: "p1", name: "Priya" }, { id: "p2", name: "Ben" }, { id: "p3", name: "Kabir" }],
	expenses: [dinner],
};

test("removing yourself clears \"you\", so who you are is asked again", () => {
	const mine = { ...group, meId: "p1" };
	assert.equal(removeMember(mine, "p1").meId, undefined);
	assert.equal(removeMember({ ...mine, expenses: [] }, "p1").meId, undefined);
	assert.equal(removeMember(mine, "p2").meId, "p1");
	assert.equal(removeMember({ ...group, meId: null }, "p1").meId, null);
});

test("another device removing you clears \"you\" here; anything else keeps it", () => {
	const mine = { ...group, meId: "p1" };
	assert.equal(meAfter(mine, removeMember(mine, "p1")), undefined);
	assert.equal(meAfter(mine, { ...mine, members: mine.members.filter((m) => m.id !== "p1") }), undefined);
	assert.equal(meAfter(mine, removeMember(mine, "p2")), "p1");
	assert.equal(meAfter({ ...group, meId: null }, removeMember(group, "p1")), null);
	// Already on someone who left (older versions allowed it): kept, so the question isn't asked on every sync.
	const left = removeMember(group, "p2");
	assert.equal(meAfter({ ...left, meId: "p2" }, left), "p2");
});
