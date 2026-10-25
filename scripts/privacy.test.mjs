// What leaves the browser for analytics and feedback: no #fragment (split and
// group keys, link-only shares) and no split id.
//   node --test --experimental-strip-types scripts/privacy.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isRecordedPath, scrubUrl } from "../lib/privateUrl.ts";

const ID = "AbCdEfGhIjKlMnOpQrStUv";
const KEY = "k".repeat(43);

test("scrubUrl drops the fragment and the split id", () => {
	assert.equal(scrubUrl(`https://splitbiller.com/s/${ID}#${KEY}`), "https://splitbiller.com/s/[id]");
	assert.equal(scrubUrl(`/s/${ID}?v=3#${KEY}`), "/s/[id]?v=3");
	assert.equal(scrubUrl("https://splitbiller.com/g?settle#p.secret~member"), "https://splitbiller.com/g?settle");
	assert.equal(scrubUrl("https://splitbiller.com/share#eyJuYW1lIjoiR29hIn0"), "https://splitbiller.com/share");
	assert.equal(scrubUrl("https://splitbiller.com/pay-story#eyJ1cGlJZCI6InByaXlhQG9rYXhpcyJ9"), "https://splitbiller.com/pay-story");
});

test("scrubUrl drops a split id with junk a chat app stuck on", () => {
	assert.equal(scrubUrl(`/s/${ID}.`), "/s/[id]");
	assert.equal(scrubUrl(`/s/${ID}%7E?v=3`), "/s/[id]?v=3");
	assert.equal(scrubUrl(`failed /s/${ID} and /s/${ID})`), "failed /s/[id] and /s/[id]");
});

test("scrubUrl leaves ordinary pages alone", () => {
	assert.equal(scrubUrl("https://splitbiller.com/tools"), "https://splitbiller.com/tools");
	assert.equal(scrubUrl("/split/dinner"), "/split/dinner");
});

test("replay records only pages that show no one's data", () => {
	for (const p of ["/", "/features", "/tools", "/about", "/roadmap", "/contact", "/split", "/split/"]) assert.ok(isRecordedPath(p), p);
	const tools = ["/upi-qr-code-generator", "/upi-bill-splitter", "/split-swiggy-zomato-bill", "/secret-santa-generator", "/group-contribution-collector", "/split/dinner", "/split/by-item"];
	for (const p of [`/s/${ID}`, "/g", "/r", "/dashboard", "/share", "/pay-story", "/secret-santa", ...tools]) assert.ok(!isRecordedPath(p), p);
});

test("error messages lose the data they quote", async () => {
	const { scrubErrorText } = await import("../lib/privateUrl.ts");
	let json;
	try {
		JSON.parse("Rahul rahul@okaxis 45000");
	} catch (err) {
		json = err.message;
	}
	const scrubbed = scrubErrorText(json);
	for (const secret of ["Rahul", "rahul@okaxis", "45000"]) assert.ok(!scrubbed.includes(secret), scrubbed);
	assert.match(scrubbed, /JSON/);
	assert.equal(scrubErrorText("Cannot read properties of undefined (reading 'Priya')"), "Cannot read properties of undefined (reading …)");
	assert.equal(scrubErrorText("pay priya@okaxis 125000 now"), "pay [upi] … now");
	assert.equal(scrubErrorText("failed at https://splitbiller.com/g#secret"), "failed at https://splitbiller.com/g");
	assert.equal(scrubErrorText("HTTP 404"), "HTTP 404");
	assert.ok(scrubErrorText("x".repeat(500)).length <= 200);
});

test("sync failures are reported as a fixed word", async () => {
	const { HttpError, UnreadableError, syncCause } = await import("../utils/groupApi.ts");
	assert.equal(syncCause(new HttpError(403, {})), "wrong_key");
	assert.equal(syncCause(new HttpError(404, {})), "deleted");
	assert.equal(syncCause(new HttpError(429, {})), "rate_limited");
	assert.equal(syncCause(new HttpError(503, {})), "server");
	assert.equal(syncCause(new HttpError(400, { error: "Rahul" })), "rejected");
	assert.equal(syncCause(new UnreadableError("x")), "unreadable");
	assert.ok(["network", "device_offline"].includes(syncCause(new TypeError("Failed to fetch"))));
});
