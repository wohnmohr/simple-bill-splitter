// Tests for the currency new groups start in (utils/localCurrency.ts).
//   node --test --experimental-strip-types scripts/local-currency.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { localCurrency } = await import("../utils/localCurrency.ts");
const code = (zone, locale) => localCurrency(zone, locale).code;

test("India by time zone, even on an en-US phone", () => {
	assert.equal(code("Asia/Kolkata", "en-US"), "INR");
	assert.equal(code("Asia/Calcutta", "hi"), "INR");
	assert.equal(code("Asia/Dubai", "en-IN"), "INR");
});

test("the locale's region picks pounds, euros or yen", () => {
	assert.equal(code("Europe/London", "en-GB"), "GBP");
	assert.equal(code("Europe/Berlin", "de-DE"), "EUR");
	assert.equal(code("Europe/Paris", "fr"), "EUR");
	assert.equal(code("Asia/Tokyo", "ja"), "JPY");
});

test("everywhere else starts in dollars", () => {
	assert.equal(code("America/New_York", "en-US"), "USD");
	assert.equal(code("Asia/Singapore", "en-SG"), "USD");
	assert.equal(code("", ""), "USD");
});
