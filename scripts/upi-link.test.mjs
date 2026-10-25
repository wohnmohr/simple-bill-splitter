// Tests for the UPI pay link and the ₹2,000 link limit (utils/upi.ts).
//   node --test --experimental-strip-types scripts/upi-link.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUpiLink, overUpiLinkLimit } from "../utils/upi.ts";

test("the link carries payee, two-decimal amount and note, with spaces as %20", () => {
	assert.equal(
		buildUpiLink({ pa: " riya@okaxis ", pn: "Riya S", am: 2300, tn: "Goa trip + cab" }),
		"upi://pay?pa=riya%40okaxis&pn=Riya%20S&cu=INR&am=2300.00&tn=Goa%20trip%20%2B%20cab"
	);
	assert.equal(buildUpiLink({ pa: "riya@okaxis", pn: "" }), "upi://pay?pa=riya%40okaxis&pn=SplitBiller&cu=INR");
	assert.equal(buildUpiLink({ pa: "riya", pn: "Riya", am: 10 }), null);
});

test("only amounts above ₹2,000 get the pay-in-app fallback", () => {
	assert.equal(overUpiLinkLimit(2000), false);
	assert.equal(overUpiLinkLimit(2000.5), true);
	assert.equal(overUpiLinkLimit(2300), true);
});

test("a mistyped UPI ID gets no pay link", () => {
	for (const pa of ["asha@", "asha", "@ybl", "a@b", "asha@ok axis"]) assert.equal(buildUpiLink({ pa, pn: "Asha", am: 300 }), null, pa);
	assert.match(buildUpiLink({ pa: "asha@kotak811", pn: "Asha", am: 300 }), /^upi:\/\/pay\?pa=asha%40kotak811/);
});

test("the note is cut at 50 characters, never through an emoji", () => {
	const link = buildUpiLink({ pa: "asha@okaxis", pn: "Asha", tn: `${"x".repeat(49)}😀 trip` });
	assert.equal(new URL(link.replace("upi:", "https:")).searchParams.get("tn"), `${"x".repeat(49)}😀`);
});
