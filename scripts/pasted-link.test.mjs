// Tests for opening a pasted SplitBiller link in the app (utils/pastedLink.ts).
//   node --test --experimental-strip-types scripts/pasted-link.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { pastedLinkPath } = await import("../utils/pastedLink.ts");
const origin = "https://www.splitbiller.com";

test("opens recovery and group links from either host", () => {
	assert.equal(pastedLinkPath("https://splitbiller.com/r#abc", origin), "/r#abc");
	assert.equal(pastedLinkPath("https://www.splitbiller.com/g?settle#k.p", origin), "/g?settle#k.p");
	assert.equal(pastedLinkPath("http://localhost:3000/r#abc", "http://localhost:3000"), "/r#abc");
});

test("finds the link inside a WhatsApp message", () => {
	const text = "My SplitBiller recovery link. Keep it private: https://www.splitbiller.com/r#xyz";
	assert.equal(pastedLinkPath(text, origin), "/r#xyz");
});

test("refuses other sites, other pages and links without a key", () => {
	assert.equal(pastedLinkPath("https://evil.example/r#abc", origin), null);
	assert.equal(pastedLinkPath("https://splitbiller.com.evil.example/r#abc", origin), null);
	assert.equal(pastedLinkPath("http://splitbiller.com/r#abc", origin), null);
	assert.equal(pastedLinkPath("https://splitbiller.com/dashboard#abc", origin), null);
	assert.equal(pastedLinkPath("https://splitbiller.com/r", origin), null);
	assert.equal(pastedLinkPath("javascript:alert(1)", origin), null);
	assert.equal(pastedLinkPath("no link here", origin), null);
});
