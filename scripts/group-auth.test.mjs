// Tests for the wrong-key limit on synced groups (lib/groupStore.ts).
//   node --test --experimental-strip-types scripts/group-auth.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { createClient } from "@libsql/client";

register("./fixtures/alias.mjs", import.meta.url);
const { appendOps, authorize, insertGroup } = await import("../lib/groupStore.ts");

const ID = "G".repeat(22);
const RIGHT = "r".repeat(43);
const wrong = (i) => String(i).padStart(43, "w");
const BLOB = "b".repeat(40);

async function freshGroup() {
	const db = createClient({ url: ":memory:" });
	await db.batch([
		"CREATE TABLE groups (id TEXT PRIMARY KEY, auth_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, head_seq INTEGER NOT NULL DEFAULT 0, snapshot_seq INTEGER NOT NULL DEFAULT 0, snapshot TEXT NOT NULL)",
		"CREATE TABLE group_ops (group_id TEXT NOT NULL, seq INTEGER NOT NULL, blob TEXT NOT NULL, PRIMARY KEY (group_id, seq))",
		"CREATE TABLE api_quota (bucket TEXT PRIMARY KEY, at INTEGER NOT NULL, n INTEGER NOT NULL)",
	]);
	assert.equal(await insertGroup(db, { ip: "ip", id: ID, token: RIGHT, blob: BLOB, expiresAt: Date.now() + 86_400_000 }), "created");
	return db;
}

const status = async (db, token) => {
	const r = await authorize(db, ID, token);
	return r.ok ? 200 : r.error.status;
};

test("a device stuck on one old key never locks the group", async () => {
	const db = await freshGroup();
	for (let i = 0; i < 100; i++) assert.equal(await status(db, wrong(1)), 403);
	assert.equal(await status(db, RIGHT), 200);
});

test("guessing keys stops the group answering for the day, even the right key", async () => {
	const db = await freshGroup();
	for (let i = 0; i < 30; i++) assert.equal(await status(db, wrong(i)), 403);
	assert.equal(await status(db, wrong(99)), 429);
	assert.equal(await status(db, RIGHT), 429);
	// A push with the right key can't confirm a guess either.
	assert.equal((await appendOps(db, { ip: "ip", id: ID, token: RIGHT, blob: BLOB })).status, 429);
	assert.equal((await db.execute("SELECT COUNT(*) AS n FROM group_ops")).rows[0].n, 0);
});

test("other groups aren't affected", async () => {
	const db = await freshGroup();
	for (let i = 0; i < 30; i++) await status(db, wrong(i));
	await insertGroup(db, { ip: "ip", id: "H".repeat(22), token: RIGHT, blob: BLOB, expiresAt: Date.now() + 86_400_000 });
	const r = await authorize(db, "H".repeat(22), RIGHT);
	assert.ok(r.ok);
	assert.equal((await appendOps(db, { ip: "ip", id: "H".repeat(22), token: RIGHT, blob: BLOB })).status, 201);
});
