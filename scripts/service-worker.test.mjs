// Tests for public/sw.js: the offline cache holds app code and the app page, never group data.
//   node --test scripts/service-worker.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ORIGIN = "https://splitbiller.com";
const context = { self: { location: { origin: ORIGIN }, addEventListener() {} }, URL, Response };
vm.runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), context);
const serve = (path, mode = "cors", destination = "") => context.strategy(new URL(path, ORIGIN), mode, destination);

test("the app page is kept for offline, network first", () => {
	assert.equal(serve("/dashboard", "navigate"), "app");
	assert.equal(serve("/dashboard?ref=home", "navigate"), "app");
});

test("shared group and split pages are never cached", () => {
	for (const path of ["/g", "/s/abc123", "/share", "/pay-story", "/"]) assert.equal(serve(path, "navigate"), "page", path);
});

test("API calls, the OCR engine and other sites pass straight through", () => {
	assert.equal(serve("/api/groups/pull"), null);
	assert.equal(serve("/api/splits/abc", "cors", "image"), null);
	assert.equal(serve("/ocr/model.onnx"), null);
	assert.equal(context.strategy(new URL("https://us.i.posthog.com/e/"), "cors", ""), null);
	assert.equal(serve("/dashboard?_rsc=1"), null);
});

test("build files, fonts and images are cached", () => {
	assert.equal(serve("/_next/static/chunks/app-123.js", "no-cors", "script"), "static");
	assert.equal(serve("/_next/static/media/outfit.woff2", "cors", "font"), "static");
	assert.equal(serve("/logo-mark.webp", "no-cors", "image"), "asset");
});
