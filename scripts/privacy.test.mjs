// What leaves the browser for analytics and feedback: no #fragment (split and
// group keys, link-only shares) and no split id.
//   node --test --experimental-strip-types scripts/privacy.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isPrivatePath, scrubUrl } from "../lib/privateUrl.ts";

const ID = "AbCdEfGhIjKlMnOpQrStUv";
const KEY = "k".repeat(43);

test("scrubUrl drops the fragment and the split id", () => {
	assert.equal(scrubUrl(`https://splitbiller.com/s/${ID}#${KEY}`), "https://splitbiller.com/s/[id]");
	assert.equal(scrubUrl(`/s/${ID}?v=3#${KEY}`), "/s/[id]?v=3");
	assert.equal(scrubUrl("https://splitbiller.com/g?settle#p.secret~member"), "https://splitbiller.com/g?settle");
	assert.equal(scrubUrl("https://splitbiller.com/share#eyJuYW1lIjoiR29hIn0"), "https://splitbiller.com/share");
	assert.equal(scrubUrl("https://splitbiller.com/pay-story#eyJ1cGlJZCI6InByaXlhQG9rYXhpcyJ9"), "https://splitbiller.com/pay-story");
});

test("scrubUrl leaves ordinary pages alone", () => {
	assert.equal(scrubUrl("https://splitbiller.com/tools"), "https://splitbiller.com/tools");
	assert.equal(scrubUrl("/split/dinner"), "/split/dinner");
});

test("pages that carry private data in the link are never recorded", () => {
	for (const p of [`/s/${ID}`, "/g", "/r", "/share", "/pay-story", "/secret-santa"]) assert.ok(isPrivatePath(p), p);
	for (const p of ["/", "/dashboard", "/tools", "/split/dinner", "/shared-costs", "/roadmap"]) assert.ok(!isPrivatePath(p), p);
});
