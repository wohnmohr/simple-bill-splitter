// Tests for reading /share links, including hand-made ones.
//   node --test --experimental-strip-types scripts/share-codec.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { deflateRawSync } from "node:zlib";

register("./fixtures/alias.mjs", import.meta.url);
const { decodeShareUrl, encodeShareUrl } = await import("../utils/shareCodec.ts");

const b64 = (bytes) => Buffer.from(bytes).toString("base64url");

/** A link in the app's own format around any payload, as someone could build by hand. */
async function link(payload) {
	const key = crypto.getRandomValues(new Uint8Array(32));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const k = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["encrypt"]);
	const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, deflateRawSync(JSON.stringify(payload))));
	return `https://splitbiller.com/share#sb1.${b64(key)}.${b64(Buffer.concat([iv, data]))}`;
}

const INR = { code: "INR", symbol: "₹", name: "Indian Rupee" };
const members = [{ i: "a", n: "Asha" }, { i: "b", n: "Ben" }];

test("a link the app made opens as it was", async () => {
	const snapshot = {
		name: "Goa",
		currency: INR,
		members: [{ id: "a", name: "Asha", upiId: "asha@okaxis" }, { id: "b", name: "Ben" }],
		expenses: [{ id: "x", amount: 1200, paidBy: "a", participants: ["a", "b"], description: "Dinner", splitMethod: "equally", createdAt: 1_760_000_000_000 }],
	};
	const back = await decodeShareUrl(await encodeShareUrl(snapshot, "https://splitbiller.com"));
	assert.deepEqual(back.members, snapshot.members);
	assert.deepEqual(back.expenses, [{ ...snapshot.expenses[0], id: "shared-exp-0" }]);
});

test("amounts that aren't real money are dropped, not added up as text", async () => {
	const back = await decodeShareUrl(
		await link({ v: 1, n: "Trip", c: "INR", m: members, e: [
			{ a: "100", p: "a", t: ["a", "b"] },
			{ a: -50, p: "a", t: ["a", "b"] },
			{ a: 1e15, p: "a", t: ["a", "b"] },
			{ a: 300, p: "a", t: ["a", "b"], d: "Lunch" },
		] })
	);
	assert.deepEqual(back.expenses.map((e) => e.amount), [300]);
});

test("broken fields don't crash the page", async () => {
	const back = await decodeShareUrl(
		await link({ v: 1, n: { x: 1 }, c: "INR", m: [...members, { i: "c", n: { x: 1 } }, null, { i: "a", n: "Copy" }], e: [
			{ a: 100, p: "a", t: null },
			{ a: 100, p: "a", t: ["a", "z"], d: { x: 1 } },
			null,
		] })
	);
	assert.equal(back.name, "Shared split");
	assert.deepEqual(back.members, [{ id: "a", name: "Asha" }, { id: "b", name: "Ben" }]);
	assert.deepEqual(back.expenses.map((e) => [e.participants, e.description]), [[["a"], undefined]]);
});

test("a link with nobody in it can't be opened", async () => {
	await assert.rejects(decodeShareUrl(await link({ v: 1, n: "Trip", c: "INR", m: [{ i: "a" }], e: [] })));
	await assert.rejects(decodeShareUrl(await link(null)));
});

test("a link that unpacks to more than a real share is refused", async () => {
	await assert.rejects(decodeShareUrl(await link({ v: 1, n: "x".repeat(2_000_000), c: "INR", m: members, e: [] })), /too big/);
});

test("the group name is cleaned like a member's", async () => {
	const back = await decodeShareUrl(await link({ v: 1, n: "Goa\u202e", c: "INR", m: members, e: [] }));
	assert.equal(back.name, "Goa");
});
