// Tests for utils/assetLinks.ts: the Play Store app is linked to the site only by valid fingerprints.
//   node --test --experimental-strip-types scripts/asset-links.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANDROID_PACKAGE, assetLinks } from "../utils/assetLinks.ts";

const A = Array.from({ length: 32 }, (_, i) => i.toString(16).padStart(2, "0")).join(":");
const B = "FF:" + A.toUpperCase().slice(3);

test("nothing is linked until fingerprints are set", () => {
	assert.deepEqual(assetLinks(), []);
	assert.deepEqual(assetLinks(" , "), []);
});

test("valid fingerprints link the app, uppercased, malformed ones dropped", () => {
	const [link] = assetLinks(` ${A} , not-a-fingerprint, ${B},AB:CD`);
	assert.deepEqual(link.relation, ["delegate_permission/common.handle_all_urls"]);
	assert.equal(link.target.package_name, ANDROID_PACKAGE);
	assert.deepEqual(link.target.sha256_cert_fingerprints, [A.toUpperCase(), B]);
});
