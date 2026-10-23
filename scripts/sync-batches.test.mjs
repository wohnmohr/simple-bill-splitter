// Tests for splitting queued group changes into pushes the server accepts.
//   node --test --experimental-strip-types scripts/sync-batches.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { MAX_PUSH_BYTES, pushBatch } = await import("../utils/groupOps.ts");
const { deriveGroupKeys, newGroupSecret, sealGroup } = await import("../utils/groupVault.ts");

// lib/groupStore.ts MAX_OPS_BLOB (that module needs the Next server to load).
const MAX_OPS_BLOB = 90_000;

// Made-up expenses; "₹" is 3 bytes in UTF-8, so bytes, not characters, must count.
const op = (n, description = `₹ snacks stop ${n} `.repeat(12)) => ({
	i: `op${n}`,
	t: n + 1,
	k: "e",
	e: `x${n}`,
	v: { amount: 120, paidBy: "m1", participants: ["m1", "m2", "m3"], splitMethod: "equally", description },
});
const queue = (n) => Array.from({ length: n }, (_, i) => op(i));
const bytes = (ops) => new TextEncoder().encode(JSON.stringify({ ops })).length;

test("a big offline queue is split into batches the server accepts", async () => {
	const keys = await deriveGroupKeys(await newGroupSecret());
	let pending = queue(400);
	let pushes = 0;
	while (pending.length) {
		const batch = pushBatch(pending);
		assert.ok(batch.length > 0);
		assert.ok(bytes(batch) <= MAX_PUSH_BYTES);
		assert.ok((await sealGroup(keys, "ops", { ops: batch })).length <= MAX_OPS_BLOB);
		pending = pending.slice(batch.length);
		pushes++;
	}
	assert.ok(pushes > 2);
});

test("a full batch fills the size budget without going over", () => {
	const pending = queue(400);
	const batch = pushBatch(pending);
	assert.ok(bytes(batch) <= MAX_PUSH_BYTES);
	assert.ok(bytes(pending.slice(0, batch.length + 1)) > MAX_PUSH_BYTES);
});

test("small changes still go at most 200 at a time", () => {
	const pending = queue(250).map((o) => ({ ...o, v: null }));
	assert.equal(pushBatch(pending).length, 200);
	assert.equal(pushBatch(pending.slice(200)).length, 50);
});

test("a change too big for any request gives an empty batch", () => {
	assert.deepEqual(pushBatch([op(0, "a".repeat(MAX_PUSH_BYTES)), op(1)]), []);
});
