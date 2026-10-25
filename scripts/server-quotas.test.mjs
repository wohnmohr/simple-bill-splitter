// Tests for the server's storage ceilings and pull paging (lib/groupStore.ts, lib/splitStore.ts).
//   node --test --experimental-strip-types scripts/server-quotas.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { createClient } from "@libsql/client";

register("./fixtures/alias.mjs", import.meta.url);
// Small ceilings so a test can reach them.
process.env.GROUP_CHARS_PER_DAY_MAX = "1000";
process.env.SPLITS_PER_HOUR_MAX = "2";
const { appendOps, fitPull, insertGroup } = await import("../lib/groupStore.ts");
const { insertSplit } = await import("../lib/splitStore.ts");
const { ipPrefix } = await import("../lib/turso.ts");

const TABLES = [
	"CREATE TABLE api_quota (bucket TEXT PRIMARY KEY, at INTEGER NOT NULL, n INTEGER NOT NULL)",
	"CREATE TABLE groups (id TEXT PRIMARY KEY, auth_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, head_seq INTEGER NOT NULL DEFAULT 0, snapshot_seq INTEGER NOT NULL DEFAULT 0, snapshot TEXT NOT NULL)",
	"CREATE TABLE group_ops (group_id TEXT NOT NULL, seq INTEGER NOT NULL, blob TEXT NOT NULL, PRIMARY KEY (group_id, seq))",
	"CREATE TABLE splits (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, write_hash TEXT NOT NULL, blob TEXT NOT NULL, ip_hash TEXT NOT NULL, payments INTEGER NOT NULL DEFAULT 0)",
];
async function freshDb() {
	const db = createClient({ url: ":memory:" });
	for (const sql of TABLES) await db.execute(sql);
	return db;
}

const token = "t".repeat(43);
const blob = (n) => "A".repeat(n);

test("group ciphertext stops at everyone's daily ceiling, and refused pushes don't use it up", async () => {
	const db = await freshDb();
	const id = "g".repeat(22);
	assert.equal(await insertGroup(db, { ip: "ip1", id, token, blob: blob(200), expiresAt: Date.now() + 1e6 }), "created");
	// A wrong token is refused before it counts against everyone.
	for (let i = 0; i < 5; i++) assert.equal((await appendOps(db, { ip: "ip2", id, token: "x".repeat(43), blob: blob(400) })).status, 403);
	assert.equal((await appendOps(db, { ip: "ip1", id, token, blob: blob(400) })).status, 201);
	assert.equal((await appendOps(db, { ip: "ip2", id, token, blob: blob(400) })).status, 201);
	// 200 + 400 + 400 = 1000 stored; one more character from any IP is over.
	const full = await appendOps(db, { ip: "ip3", id, token, blob: blob(40) });
	assert.equal(full.status, 503);
	const ops = await db.execute("SELECT COUNT(*) AS n FROM group_ops");
	assert.equal(Number(ops.rows[0].n), 2);
	assert.equal(await insertGroup(db, { ip: "ip3", id: "h".repeat(22), token, blob: blob(40), expiresAt: Date.now() + 1e6 }), "quota");
});

test("a pull page stays under the response limit and always moves forward", () => {
	const rows = Array.from({ length: 200 }, (_, i) => ({ seq: i + 1, blob: blob(90_000) }));
	const page = fitPull(rows, 720_000);
	assert.ok(page.length > 0 && page.length < rows.length);
	assert.ok(720_000 + page.reduce((n, r) => n + r.blob.length, 0) <= 3_000_000);
	// Small changes all come in one go.
	assert.equal(fitPull(rows.map((r) => ({ ...r, blob: blob(2000) })), 0).length, 200);
	// Even an oversized first row is sent, so the device never stalls.
	assert.equal(fitPull([{ seq: 1, blob: blob(10) }], 5_000_000).length, 1);
});

test("re-sending an existing split doesn't use up the global ceiling", async () => {
	const db = await freshDb();
	const row = (id) => ({ id, writeHash: "w", blob: blob(100), ipHash: "ip1", now: Date.now() });
	assert.equal(await insertSplit(db, row("a".repeat(22))), "created");
	for (let i = 0; i < 10; i++) assert.equal(await insertSplit(db, row("a".repeat(22))), "exists");
	assert.equal(await insertSplit(db, row("b".repeat(22))), "created");
	assert.equal(await insertSplit(db, row("c".repeat(22))), "busy");
});

test("IPv6 addresses count by their /64, IPv4 by the address", () => {
	assert.equal(ipPrefix("2001:db8:1:2:aaaa::1"), ipPrefix("2001:0db8:0001:0002:ffff:1:2:3"));
	assert.notEqual(ipPrefix("2001:db8:1:2::1"), ipPrefix("2001:db8:1:3::1"));
	assert.equal(ipPrefix("2001:db8::1"), "2001:db8:0:0::/64");
	assert.equal(ipPrefix("203.0.113.7"), "203.0.113.7");
	assert.equal(ipPrefix("::ffff:203.0.113.7"), "::ffff:203.0.113.7");
});
