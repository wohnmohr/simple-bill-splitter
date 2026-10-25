// Tests for the opt-in encrypted backup of a device's groups.
//   node --test --experimental-strip-types scripts/backup.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { mergeRestored, readBackup, saveBackup, startBackup, REFRESH_MS } = await import("../utils/groupBackup.ts");
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

/** A stand-in for the group endpoints holding one backup, so several devices can share it. */
function fakeServer() {
	const s = { head: 0, snapshotSeq: 0, snapshot: null, calls: [] };
	const routes = {
		"": (b) => ((s.snapshot = b.blob), { ok: true }),
		"/push": () => ({ seq: ++s.head }),
		"/snapshot": (b) => {
			if (b.upTo > s.snapshotSeq) [s.snapshot, s.snapshotSeq] = [b.blob, b.upTo];
			return { ok: true, seq: s.snapshotSeq };
		},
		"/pull": () => ({ seq: s.snapshotSeq, head: s.head, snapshotSeq: s.snapshotSeq, snapshot: { seq: s.snapshotSeq, blob: s.snapshot }, ops: [] }),
	};
	globalThis.fetch = async (url, init) => {
		s.calls.push(String(url));
		const body = routes[String(url).replace("/api/groups", "")](JSON.parse(init.body));
		return new Response(JSON.stringify(body), { status: 200 });
	};
	return s;
}

test("unchanged groups aren't uploaded again until a refresh is due", async () => {
	const server = fakeServer();
	const first = await startBackup([group("a")]);
	server.calls.length = 0;

	assert.equal(await saveBackup(first, [group("a")], first.savedAt + 1000), first);
	assert.equal(server.calls.length, 0);

	await saveBackup(first, [group("a", { name: "Goa" })], first.savedAt + 2000);
	assert.deepEqual(server.calls, ["/api/groups/pull", "/api/groups/push", "/api/groups/snapshot"]);

	await saveBackup(first, [group("a")], first.savedAt + REFRESH_MS);
	assert.equal(server.calls.length, 6);
});

test("two devices on one recovery link keep each other's groups", async () => {
	fakeServer();
	const g1 = group("g1", { name: "Goa" });
	let a = await startBackup([g1, group("g2")]);
	// Phone B restores the backup and adopts its link, then makes a group of its own.
	const onB = await readBackup(a.link);
	let b = await saveBackup({ link: a.link }, [...onB, group("b1", { name: "Made on phone B" })]);
	// Phone A, which never saw B's group, renames one of its own.
	a = await saveBackup(a, [{ ...g1, name: "Goa (edited on A)" }, group("g2")]);
	assert.deepEqual((await readBackup(a.link)).map((g) => g.name), ["Goa (edited on A)", "Group g2", "Made on phone B"]);

	// A group a device deletes leaves the backup; groups only the other device saved stay.
	a = await saveBackup(a, [group("g2")]);
	assert.deepEqual((await readBackup(a.link)).map((g) => g.id), ["g2", "b1"]);
	b = await saveBackup(b, [group("g2")]);
	assert.deepEqual((await readBackup(a.link)).map((g) => g.id), ["g2"]);
});

test("a backup another device saves in between is merged again, not overwritten", async () => {
	const server = fakeServer();
	const a = await startBackup([group("a1")]);
	const serve = globalThis.fetch;
	globalThis.fetch = async (url, init) => {
		const res = await serve(url, init);
		// Right after A reads the backup, B saves a group of its own.
		if (String(url).endsWith("/pull")) {
			globalThis.fetch = serve;
			await saveBackup({ link: a.link }, [group("b1")]);
		}
		return res;
	};
	await saveBackup(a, [group("a1", { name: "renamed" })]);
	assert.deepEqual((await readBackup(a.link)).map((g) => g.name), ["renamed", "Group b1"]);
	assert.equal(server.snapshotSeq, 3);
});
