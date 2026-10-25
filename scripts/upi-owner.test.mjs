// Tests for who may set a UPI ID: in a shared group, only that person or the host's device.
// Also: a UPI ID changed on another device is pointed out before anyone pays it.
//   node --test --experimental-strip-types scripts/upi-owner.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { canSetUpi, hostOf, upiChangedLately, upiChanges, withHosted } = await import("../utils/members.ts");
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

test("the device that shared the group sets anyone's", () => {
	const ben = { ...group, meId: "p2", hosted: true };
	assert.equal(canSetUpi(ben, "p1"), true);
	assert.equal(canSetUpi(ben, "p3"), true);
	assert.equal(canSetUpi(ben), true);
});

test("picking the host as you on another phone doesn't make it the host", () => {
	const claimed = { ...group, meId: "p2", hosted: false };
	assert.equal(canSetUpi(claimed, "p1"), false);
	assert.equal(canSetUpi(claimed), false);
	assert.equal(canSetUpi(claimed, "p2"), true, "only the person picked");
	assert.equal(withHosted(claimed), claimed, "settled once, never worked out again");
});

test("groups saved before hosts were kept: the device whose you is the host shared it", () => {
	assert.equal(withHosted({ ...group, meId: "p2" }).hosted, true);
	assert.equal(withHosted({ ...group, meId: "p3" }).hosted, false);
	assert.equal(withHosted({ ...group, meId: undefined }).hosted, false);
	const { sync: _s, ...local } = group;
	assert.equal(withHosted(local), local, "a group on this device alone needs no host");
});

test("a joined group is never this device's to host", () => {
	const state = emptyState();
	groupAsChanges(group).forEach((c, n) => applyOp(state, { ...c, i: `o${n}`, t: 1 }));
	const joined = materialize(state, { id: "g", sync, hosted: false });
	assert.equal(canSetUpi({ ...joined, meId: "p2" }, "p1"), false);
	assert.equal(materialize(state, { id: "g", sync, hosted: true }).hosted, true, "kept through merges");
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
	assert.equal(canSetUpi(withHosted({ ...old, meId: "p1" }), "p3"), true);
	assert.equal(canSetUpi(withHosted({ ...old, meId: "p2" }), "p3"), false);
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

const withUpi = (upiId) => ({ ...group, members: group.members.map((m) => (m.id === "p3" ? { ...m, ...(upiId ? { upiId } : {}) } : m)) });
const DAY = 24 * 60 * 60 * 1000;

test("another device changing someone's UPI ID is pointed out for two weeks", () => {
	const after = withUpi("mal@okaxis");
	const seen = upiChanges(withUpi("asha@okicici"), after, 1000);
	assert.deepEqual(seen, { p3: 1000 });
	assert.equal(upiChangedLately({ ...after, upiChangedAt: seen }, "p3", 1000 + 13 * DAY), true);
	assert.equal(upiChangedLately({ ...after, upiChangedAt: seen }, "p3", 1000 + 15 * DAY), false);
	assert.equal(upiChangedLately(after, "p1", 1000), false);
	assert.equal(upiChanges(after, { ...after, upiChangedAt: seen }, 1000 + 15 * DAY), undefined, "then forgotten");
});

test("a first UPI ID from another device is pointed out too, but a new member's isn't", () => {
	assert.deepEqual(upiChanges(withUpi(), withUpi("mal@okaxis"), 1000), { p3: 1000 });
	assert.equal(upiChanges(withUpi("asha@okicici"), withUpi("asha@okicici"), 1000), undefined);
	const joined = { ...group, members: [...group.members, { id: "p9", name: "Dev", upiId: "dev@okaxis" }] };
	assert.equal(upiChanges(group, joined, 1000), undefined);
});
