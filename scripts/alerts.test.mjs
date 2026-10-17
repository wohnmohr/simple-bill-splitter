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
	assert.deepEqual(cleanSubscription({ ...sub("https://fcm.googleapis.com/x"), extra: "dropped" }), sub("https://fcm.googleapis.com/x"));
});

test("the device that made a change isn't alerted, and nobody twice in a row", async () => {
	const db = createClient({ url: ":memory:" });
	await db.execute("CREATE TABLE group_push (group_id TEXT NOT NULL, endpoint_hash TEXT NOT NULL, sub TEXT NOT NULL, notified_at INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (group_id, endpoint_hash))");
	const mine = "https://fcm.googleapis.com/fcm/send/mine";
	const theirs = "https://fcm.googleapis.com/fcm/send/theirs";
	const gone = "https://fcm.googleapis.com/fcm/send/gone";
	for (const e of [mine, theirs, gone]) await db.execute({ sql: "INSERT INTO group_push VALUES ('G', ?, ?, 0)", args: [endpointHash(e), JSON.stringify(sub(e))] });

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
