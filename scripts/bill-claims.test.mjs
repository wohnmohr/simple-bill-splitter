// Tests for utils/billClaims.ts: "tap what you ate" share maths.
//   node --test --experimental-strip-types scripts/bill-claims.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { billTarget, sanitizeClaim, sanitizeItems, tally } from "../utils/billClaims.ts";

// The sample Swiggy order: ₹1,098 of items, ₹1,079.35 to pay after fees, GST and a discount.
const items = [
	["Paneer Butter Masala", 320],
	["Chicken Dum Biryani ×2", 598],
	["Butter Naan ×4", 180],
];
const bill = (claims, paid = []) => ({ target: billTarget(1079.35), name: "Priya", items, claims, paid });
const share = (t, name) => t.diners.find((d) => d.name === name)?.share;

test("the target is the bill total rounded up to a whole rupee", () => {
	assert.equal(billTarget(1079.35), 1080);
	assert.equal(billTarget(1080), 1080);
	assert.equal(billTarget(0.1 + 0.2), 1);
});

test("taxes, fees and discounts are spread in proportion to what each person had", () => {
	const t = tally(bill([["Asha", [0]], ["Ben", [1]], ["Priya", [2]]]));
	const scale = 1080 / 1098;
	assert.equal(share(t, "Asha"), Math.ceil(320 * scale)); // 315
	assert.equal(share(t, "Ben"), Math.ceil(598 * scale)); // 589
	assert.equal(share(t, "Priya"), Math.ceil(180 * scale)); // 178
	assert.equal(t.diners.find((d) => d.name === "Asha").own, 320);
	assert.equal(t.claimedItems, 3);
	assert.equal(t.unclaimed, 0);
});

test("a line claimed by several people is shared equally between them", () => {
	const t = tally(bill([["Asha", [0, 2]], ["Ben", [1, 2]]]));
	assert.deepEqual(t.claimers[2], ["Asha", "Ben"]);
	assert.equal(t.diners.find((d) => d.name === "Asha").own, 410);
	assert.equal(t.diners.find((d) => d.name === "Ben").own, 688);
	// Rounded up per person, so the organiser is never short.
	assert.ok(share(t, "Asha") + share(t, "Ben") >= 1080);
});

test("a person's latest claim replaces their earlier one, and an empty claim removes them", () => {
	let t = tally(bill([["Asha", [0]], ["Ben", [1]], ["asha ", [0, 1]]]));
	assert.deepEqual(t.diners.map((d) => [d.name, d.items]), [["asha ", [0, 1]], ["Ben", [1]]]);
	assert.deepEqual(t.claimers[1], ["asha ", "Ben"]);
	t = tally(bill([["Asha", [0]], ["Asha", []]]));
	assert.equal(t.diners.length, 0);
	assert.equal(t.claimedItems, 0);
});

test("unclaimed lines are reported, and the board is done only when all is claimed and paid", () => {
	let t = tally(bill([["Asha", [0]]]));
	assert.equal(t.unclaimed, Math.ceil(778 * (1080 / 1098)));
	assert.equal(t.done, false);

	const claims = [["Asha", [0]], ["Ben", [1]], ["Priya", [2]]];
	t = tally(bill(claims, [["Asha", 315]]));
	assert.equal(t.done, false);
	assert.equal(t.collected, 315 + 178); // Asha's mark plus the organiser's own part
	t = tally(bill(claims, [["Asha", 315], ["BEN", 589]]));
	assert.equal(t.done, true);
	assert.equal(t.collected, 1080);
});

test("the organiser's own part counts as paid without a mark", () => {
	const t = tally(bill([["priya", [2]]]));
	assert.equal(t.diners[0].organiser, true);
	assert.equal(t.diners[0].paid, true);
});

test("untrusted bills and claims are cleaned", () => {
	assert.equal(sanitizeItems([]), null);
	assert.equal(sanitizeItems("nope"), null);
	assert.deepEqual(sanitizeItems([["  Naan  ", 45.123], ["Free", 0], ["Bad", "12"], "x", ["x".repeat(60), 10]]), [
		["Naan", 45.12],
		["x".repeat(40), 10],
	]);
	assert.equal(sanitizeItems(Array.from({ length: 99 }, (_, i) => [`i${i}`, 1])).length, 40);

	assert.deepEqual(sanitizeClaim(["Asha", [2, 0, 2, 7, -1, 1.5, "1"]], 3), ["Asha", [0, 2]]);
	assert.equal(sanitizeClaim(["   ", [0]], 3), null);
	assert.equal(sanitizeClaim(["Asha", 0], 3), null);
	assert.equal(sanitizeClaim({ name: "Asha" }, 3), null);
});
