// Tests that a reset (or deleted) group link stays dead for anyone who still has it.
//   node --test --experimental-strip-types scripts/reset-link.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";

register("./fixtures/alias.mjs", import.meta.url);
const { appendOps, authorize, deleteGroup, insertGroup, purgeExpiredGroups } = await import("../lib/groupStore.ts");
const { GroupSync } = await import("../utils/groupSync.ts");
const { newGroupSecret } = await import("../utils/groupVault.ts");

// The group tables from lib/turso.ts (that module's schema isn't exported).
async function testDb() {
	const dir = mkdtempSync(join(tmpdir(), "reset-link-"));
	const db = createClient({ url: `file:${join(dir, "test.db")}` });
	await db.batch([
		"CREATE TABLE groups (id TEXT PRIMARY KEY, auth_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, head_seq INTEGER NOT NULL DEFAULT 0, snapshot_seq INTEGER NOT NULL DEFAULT 0, snapshot TEXT NOT NULL)",
		"CREATE TABLE group_ops (group_id TEXT NOT NULL, seq INTEGER NOT NULL, blob TEXT NOT NULL, PRIMARY KEY (group_id, seq))",
		"CREATE TABLE group_push (group_id TEXT NOT NULL, endpoint_hash TEXT NOT NULL, sub TEXT NOT NULL, notified_at INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (group_id, endpoint_hash))",
		"CREATE TABLE api_quota (bucket TEXT PRIMARY KEY, at INTEGER NOT NULL, n INTEGER NOT NULL)",
	]);
	return { db, done: () => (db.close(), rmSync(dir, { recursive: true, force: true })) };
}

const g = { ip: "test", id: "A".repeat(22), token: "t".repeat(43), blob: "b".repeat(40) };

test("a deleted group can't be made again with the old link, and reads as gone", async () => {
	const { db, done } = await testDb();
	try {
		assert.equal(await insertGroup(db, { ...g, expiresAt: Date.now() + 1000 }), "created");
		assert.equal((await appendOps(db, g)).status, 201);
		await deleteGroup(db, g.id);

		assert.equal(await insertGroup(db, { ...g, expiresAt: Date.now() + 1000 }), "exists");
		const auth = await authorize(db, g.id, g.token);
		assert.equal(auth.ok, false);
		assert.equal(auth.error.status, 404);
		assert.equal((await appendOps(db, g)).status, 404);
		const left = await db.execute("SELECT snapshot, (SELECT COUNT(*) FROM group_ops) AS ops FROM groups");
		assert.deepEqual([left.rows[0].snapshot, Number(left.rows[0].ops)], ["", 0]);

		// Once it expires, the empty row is purged like any other.
		await db.execute({ sql: "UPDATE groups SET expires_at = 0", args: [] });
		await purgeExpiredGroups(db);
		assert.equal((await db.execute("SELECT COUNT(*) AS n FROM groups")).rows[0].n, 0);
	} finally {
		done();
	}
});

test("a device that missed a reset stops when the old id comes back with a lower head", async () => {
	const store = new Map();
	globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) };
	// First the real group at change 5, then the same id made again from scratch.
	const pulls = [{ seq: 5, head: 5, snapshotSeq: 0, ops: [] }, { unchanged: true, seq: 0, snapshotSeq: 0 }];
	const pushes = [];
	globalThis.fetch = async (url) => {
		const path = String(url).replace("/api/groups", "");
		if (path === "/push") pushes.push(path);
		return new Response(JSON.stringify(path === "/pull" ? pulls.shift() : { ok: true }), { status: 200 });
	};
	const group = { id: "g1", name: "Trip", currency: { code: "INR", symbol: "₹", name: "Indian Rupee" }, members: [], expenses: [], sync: { secret: await newGroupSecret() } };
	const engine = new GroupSync(group, () => undefined, () => undefined);
	await engine.sync("g1", true);
	assert.equal(engine.status, "synced");
	await engine.sync("g1", true);
	assert.equal(engine.status, "gone");
	assert.equal(JSON.parse(store.get("splitbiller-sync:g1")).gone, true);
	// Nothing new is sent to the group made again.
	engine.observe({ ...group, name: "Trip 2" });
	await engine.sync("g1", true);
	assert.deepEqual(pushes, []);
});
