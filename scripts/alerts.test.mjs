// Tests for opt-in alerts on synced groups (lib/groupPush.ts).
//   node --test --experimental-strip-types scripts/alerts.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { createClient } from "@libsql/client";
import webpush from "web-push";

register("./fixtures/alias.mjs", import.meta.url);
const vapid = webpush.generateVAPIDKeys();
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = vapid.publicKey;
process.env.VAPID_PRIVATE_KEY = vapid.privateKey;
const { alertGroup, cleanSubscription, endpointHash } = await import("../lib/groupPush.ts");

const keys = { p256dh: "B".repeat(87), auth: "a".repeat(22) };
const sub = (endpoint) => ({ endpoint, keys });

test("only the browsers' push services are accepted", () => {
	for (const ok of [
		"https://fcm.googleapis.com/fcm/send/abc",
		"https://updates.push.services.mozilla.com/wpush/v2/abc",
		"https://web.push.apple.com/QAbc",
		"https://wns2-par02p.notify.windows.com/w/?token=abc",
	]) assert.ok(cleanSubscription(sub(ok)), ok);
	for (const bad of [
		"http://fcm.googleapis.com/fcm/send/abc",
		"https://fcm.googleapis.com:8443/x",
		"https://fcm.googleapis.com.evil.example/x",
		"https://169.254.169.254/latest/meta-data",
		"https://localhost/x",
		"not a url",
	]) assert.equal(cleanSubscription(sub(bad)), null, bad);
	assert.equal(cleanSubscription({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "x", auth: "y" } }), null);
	// Keys must be the right size for a real browser: a P-256 point and a 16-byte secret.
	assert.equal(cleanSubscription({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "B".repeat(20), auth: keys.auth } }), null);
	assert.equal(cleanSubscription({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "A".repeat(87), auth: keys.auth } }), null);
	assert.equal(cleanSubscription({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: keys.p256dh, auth: "a".repeat(30) } }), null);
	assert.deepEqual(cleanSubscription({ ...sub("https://fcm.googleapis.com/x"), extra: "dropped" }), sub("https://fcm.googleapis.com/x"));
});

test("the device that made a change isn't alerted, and nobody twice in a row", async () => {
	const db = createClient({ url: ":memory:" });
	await db.execute("CREATE TABLE group_push (group_id TEXT NOT NULL, endpoint_hash TEXT NOT NULL, sub TEXT NOT NULL, notified_at INTEGER NOT NULL DEFAULT 0, fails INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (group_id, endpoint_hash))");
	const mine = "https://fcm.googleapis.com/fcm/send/mine";
	const theirs = "https://fcm.googleapis.com/fcm/send/theirs";
	const gone = "https://fcm.googleapis.com/fcm/send/gone";
	for (const e of [mine, theirs, gone]) await db.execute({ sql: "INSERT INTO group_push (group_id, endpoint_hash, sub) VALUES ('G', ?, ?)", args: [endpointHash(e), JSON.stringify(sub(e))] });

	const sent = [];
	webpush.sendNotification = async (s, payload) => {
		sent.push([s.endpoint, payload]);
		if (s.endpoint === gone) throw Object.assign(new Error("Gone"), { statusCode: 410 });
	};
	await alertGroup(db, "G", endpointHash(mine));
	assert.deepEqual(sent.map(([e]) => e).sort(), [gone, theirs].sort());
	// The alert names the group by id only: no names, amounts or anything else.
	assert.equal(sent[0][1], JSON.stringify({ g: "G" }));
	// A subscription the push service says is gone is forgotten.
	const left = await db.execute("SELECT endpoint_hash FROM group_push");
	assert.equal(left.rows.length, 2);

	sent.length = 0;
	await alertGroup(db, "G", null);
	assert.deepEqual(sent.map(([e]) => e), [mine]);
});

test("dead sign-ups are forgotten so they can't fill a group's slots", async () => {
	const db = createClient({ url: ":memory:" });
	await db.execute("CREATE TABLE group_push (group_id TEXT NOT NULL, endpoint_hash TEXT NOT NULL, sub TEXT NOT NULL, notified_at INTEGER NOT NULL DEFAULT 0, fails INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (group_id, endpoint_hash))");
	const ok = "https://fcm.googleapis.com/fcm/send/ok";
	const refused = "https://fcm.googleapis.com/fcm/send/refused";
	const flaky = "https://fcm.googleapis.com/fcm/send/flaky";
	const nowhere = "https://nx1.push.apple.com/x";
	for (const e of [ok, refused, flaky, nowhere]) await db.execute({ sql: "INSERT INTO group_push (group_id, endpoint_hash, sub) VALUES ('G', ?, ?)", args: [endpointHash(e), JSON.stringify(sub(e))] });

	const topics = new Map();
	let round = 0;
	webpush.sendNotification = async (s, _payload, opts) => {
		topics.set(s.endpoint, opts.topic);
		if (s.endpoint === refused) throw Object.assign(new Error("Bad"), { statusCode: 400 });
		if (s.endpoint === nowhere || (s.endpoint === flaky && round !== 1)) throw new Error("getaddrinfo ENOTFOUND");
	};
	const left = async () => (await db.execute("SELECT endpoint_hash FROM group_push ORDER BY endpoint_hash")).rows.map((r) => r.endpoint_hash);
	for (round = 0; round < 4; round++) {
		await alertGroup(db, "G", null);
		await db.execute("UPDATE group_push SET notified_at = 0");
		if (round === 0) assert.ok(!(await left()).includes(endpointHash(refused)), "a refused address goes at once");
	}
	// Three failures in a row forget an address; one that came back in between stays.
	assert.deepEqual(await left(), [ok, flaky].map(endpointHash).sort());

	// The push service sees a different label per device, never the group id.
	assert.equal(new Set(topics.values()).size, 4);
	for (const t of topics.values()) assert.ok(t !== "G" && /^[A-Za-z0-9_-]{32}$/.test(t));
});
