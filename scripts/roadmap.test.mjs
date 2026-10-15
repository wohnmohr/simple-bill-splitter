// Tests for content/roadmap.ts: reading the roadmap edited in Edge Config.
//   node --test --experimental-strip-types scripts/roadmap.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRoadmap, STATIC_ROADMAP } from "../content/roadmap.ts";

const planned = { icon: "scan", title: "Scan paper bills", body: "Photo in, items out." };

test("the static roadmap reads back unchanged", () => {
	assert.deepEqual(parseRoadmap(JSON.parse(JSON.stringify(STATIC_ROADMAP))), STATIC_ROADMAP);
});

test("anything that isn't a roadmap is rejected, so the page falls back", () => {
	for (const raw of [null, "roadmap", [], {}, { next: [], later: [] }, { next: {}, later: [], shipped: [] }]) {
		assert.equal(parseRoadmap(raw), null);
	}
});

test("a malformed item is dropped and the rest still show", () => {
	const r = parseRoadmap({
		next: [planned, { ...planned, icon: "rocket" }, { ...planned, body: " " }, "Export"],
		later: [],
		shipped: [{ month: "October 2026", items: [{ title: "Exports", href: "/features" }, { title: "No link" }] }],
	});
	assert.deepEqual(r.next, [planned]);
	assert.deepEqual(r.shipped, [{ month: "October 2026", items: [{ title: "Exports", href: "/features" }] }]);
});

test("shipped items only link within the site", () => {
	const items = ["https://evil.example", "//evil.example", "javascript:alert(1)", "features", "/features#sync"].map((href) => ({ title: href, href }));
	const r = parseRoadmap({ next: [], later: [], shipped: [{ month: "October 2026", items }] });
	assert.deepEqual(r.shipped[0].items.map((i) => i.href), ["/features#sync"]);
});

test("a month with nothing left to show is hidden", () => {
	const r = parseRoadmap({ next: [], later: [], shipped: [{ month: "September 2026", items: [] }, { items: [] }] });
	assert.deepEqual(r.shipped, []);
});
