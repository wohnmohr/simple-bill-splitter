// Tests for who may set a UPI ID: in a shared group, only that person or the host.
//   node --test --experimental-strip-types scripts/upi-owner.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { canSetUpi, hostOf } = await import("../utils/members.ts");
const { applyOp, diffGroup, emptyState, groupAsChanges, materialize } = await import("../utils/groupOps.ts");

const sync = { secret: "s" };
const group = {
	id: "g",
	name: "Goa trip",
	currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
	members: [{ id: "p1", name: "Priya" }, { id: "p2", name: "Ben" }, { id: "p3", name: "Asha" }],
	expenses: [],
	hostId: "p2",
	sync,
};

test("in a shared group you set only your own UPI ID", () => {
	const asha = { ...group, meId: "p3" };
	assert.equal(canSetUpi(asha, "p3"), true);
	assert.equal(canSetUpi(asha, "p1"), false);
	assert.equal(canSetUpi(asha), false, "nor a new member's");
});

test("the host sets anyone's", () => {
	const ben = { ...group, meId: "p2" };
	assert.equal(canSetUpi(ben, "p1"), true);
	assert.equal(canSetUpi(ben, "p3"), true);
	assert.equal(canSetUpi(ben), true);
});

test("someone just looking sets no one's", () => {
	assert.equal(canSetUpi({ ...group, meId: null }, "p1"), false);
	assert.equal(canSetUpi({ ...group, meId: undefined }, "p1"), false);
});

test("a group on this device alone is all yours", () => {
	const { sync: _s, hostId: _h, ...local } = group;
	assert.equal(canSetUpi(local, "p3"), true);
	assert.equal(canSetUpi(local), true);
});

test("groups shared before hosts were recorded fall back to the first person added", () => {
	const { hostId: _h, ...old } = group;
	assert.equal(hostOf(old), "p1");
	assert.equal(canSetUpi({ ...old, meId: "p1" }, "p3"), true);
	assert.equal(canSetUpi({ ...old, meId: "p2" }, "p3"), false);
});

test("the host syncs with the group and is written only once", () => {
	const state = emptyState();
	groupAsChanges(group).forEach((c, n) => applyOp(state, { ...c, i: `o${n}`, t: 1 }));
	const shown = materialize(state, { id: "g", meId: "p3", sync });
	assert.equal(shown.hostId, "p2");
	assert.deepEqual(diffGroup(shown, { ...shown, hostId: "p3" }), [], "another phone can't take over as host");
});

test("a host who isn't a member is ignored", () => {
	const state = emptyState();
	groupAsChanges({ ...group, hostId: "nobody" }).forEach((c, n) => applyOp(state, { ...c, i: `o${n}`, t: 1 }));
	assert.equal(materialize(state, { id: "g", sync }).hostId, undefined);
});
