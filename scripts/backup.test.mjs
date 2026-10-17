// Tests for the opt-in encrypted backup of a device's groups.
//   node --test --experimental-strip-types scripts/backup.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { mergeRestored, saveBackup, REFRESH_MS } = await import("../utils/groupBackup.ts");
const { deriveGroupKeys, newGroupSecret, openGroup, sealGroup } = await import("../utils/groupVault.ts");

const inr = { code: "INR", symbol: "₹", name: "Indian Rupee" };
const group = (id, extra = {}) => ({ id, name: `Group ${id}`, currency: inr, members: [], expenses: [], ...extra });

test("restoring adds only groups this device doesn't have", () => {
	const local = [group("a"), group("b", { sync: { secret: "S1" } })];
	const restored = [group("a", { name: "older copy" }), group("c", { sync: { secret: "S1" } }), group("d")];
	const { groups, added } = mergeRestored(local, restored, 20);
	assert.equal(added, 1);
	assert.deepEqual(groups.map((g) => g.id), ["a", "b", "d"]);
	assert.equal(groups[0].name, "Group a");
});

test("restoring stops at the group limit", () => {
	const { groups, added } = mergeRestored([group("a")], [group("b"), group("c")], 2);
	assert.equal(added, 1);
	assert.equal(groups.length, 2);
});

test("a backup can't be opened as a group, or a group as a backup", async () => {
	const keys = await deriveGroupKeys(await newGroupSecret());
	const blob = await sealGroup(keys, "backup", { groups: [group("a")] });
	assert.deepEqual(await openGroup(keys, "backup", blob), { groups: [group("a")] });
	assert.equal(await openGroup(keys, "snapshot", blob), null);
	assert.equal(await openGroup(keys, "backup", await sealGroup(keys, "snapshot", {})), null);
});

test("unchanged groups aren't uploaded again until a refresh is due", async () => {
	const calls = [];
	globalThis.fetch = async (url, init) => {
		calls.push(String(url));
		return new Response(JSON.stringify({ ok: true, seq: calls.length }), { status: 200 });
	};
	const link = { secret: await newGroupSecret() };
	const now = Date.now();
	const first = await saveBackup({ link }, [group("a")], now);
	assert.deepEqual(calls, ["/api/groups/push", "/api/groups/snapshot"]);
	assert.equal(first.savedAt, now);

	assert.equal(await saveBackup(first, [group("a")], now + 1000), first);
	assert.equal(calls.length, 2);

	await saveBackup(first, [group("a", { name: "Goa" })], now + 2000);
	assert.equal(calls.length, 4);

	await saveBackup(first, [group("a")], now + REFRESH_MS);
	assert.equal(calls.length, 6);
});
