// Tests for saving someone else's split summary as a group on this device.
//   node --test --experimental-strip-types scripts/share-import.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { importShareSnapshot, inviteNudgeKey } = await import("../utils/shareImport.ts");

const memory = () => {
	const store = new Map();
	return { setItem: (k, v) => store.set(k, String(v)), getItem: (k) => store.get(k) ?? null, removeItem: (k) => store.delete(k) };
};

test("a group saved from someone else's summary doesn't ask you to send everyone their share", () => {
	globalThis.localStorage = memory();
	globalThis.window = { localStorage: globalThis.localStorage, sessionStorage: memory() };
	try {
		const snapshot = { name: "Dinner", currency: { code: "INR", symbol: "₹", name: "Indian Rupee" }, members: [{ id: "a", name: "Asha" }, { id: "r", name: "Riya" }], expenses: [] };
		const result = importShareSnapshot(snapshot, "r");
		assert.equal(result.ok, true);
		assert.equal(localStorage.getItem(inviteNudgeKey(result.groupId)), "imported");
	} finally {
		delete globalThis.window;
		delete globalThis.localStorage;
	}
});
