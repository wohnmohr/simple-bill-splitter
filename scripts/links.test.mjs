// Tests for reading group and share links the way chat apps pass them on.
//   node --test --experimental-strip-types scripts/links.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { parseGroupFragment } = await import("../utils/groupVault.ts");
const { decodeShareUrl, encodeShareUrl } = await import("../utils/shareCodec.ts");

const secret = "A".repeat(42) + "w";

test("a group link reads the same with ~ written as %7E, or a full stop after it", () => {
	const me = { secret, needsPassphrase: false, me: "member-ben" };
	assert.deepEqual(parseGroupFragment(`#${secret}~member-ben`), me);
	assert.deepEqual(parseGroupFragment(`#${secret}%7Emember-ben`), me);
	assert.deepEqual(parseGroupFragment(`#${secret}~member-ben.`), me);
	assert.deepEqual(parseGroupFragment(`#p.${secret})`), { secret, needsPassphrase: true });
	assert.equal(parseGroupFragment("#tooShort"), null);
});

test("a share link with a full stop after it still opens", async () => {
	const url = await encodeShareUrl({ name: "Goa", currency: { code: "INR", symbol: "₹", name: "Indian Rupee" }, members: [{ id: "a", name: "Asha" }], expenses: [] }, "https://splitbiller.com");
	assert.equal((await decodeShareUrl(`${url}.`)).name, "Goa");
});
