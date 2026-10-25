// Tests for comments on expenses in a synced group (utils/groupOps.ts).
//   node --test --experimental-strip-types scripts/comments.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { applyOp, diffGroup, emptyState, materialize } = await import("../utils/groupOps.ts");

let clock = 0;
const put = (state, k, e, v) => applyOp(state, { i: `o${++clock}`, t: clock, k, e, v });
const group = () => {
	const state = emptyState();
	put(state, "m", "p1", { name: "Priya" });
	put(state, "m", "p2", { name: "Asha" });
	put(state, "e", "e1", { amount: 900, paidBy: "p1", participants: ["p1", "p2"], splitMethod: "equally", description: "Cab" });
	return state;
};
const view = (state) => materialize(state, { id: "g" });

test("comments arrive on their expense, oldest first", () => {
	const state = group();
	put(state, "c", "c2", { expenseId: "e1", by: "p1", text: "Surge pricing", at: 2000 });
	put(state, "c", "c1", { expenseId: "e1", by: "p2", text: "Why ₹900 for the cab?", at: 1000 });
	assert.deepEqual(view(state).comments.map((c) => c.text), ["Why ₹900 for the cab?", "Surge pricing"]);
});

test("a comment on a deleted expense, or with no text, is not shown", () => {
	const state = group();
	put(state, "c", "c1", { expenseId: "gone", text: "hi", at: 1 });
	put(state, "c", "c2", { expenseId: "e1", text: "   ", at: 1 });
	assert.equal(view(state).comments, undefined);
});

test("an author who isn't a member becomes anonymous, long text is cut", () => {
	const state = group();
	put(state, "c", "c1", { expenseId: "e1", by: "stranger", text: "x".repeat(900), at: 1 });
	const [c] = view(state).comments;
	assert.equal(c.by, undefined);
	assert.equal(c.text.length, 500);
});

test("a new comment becomes one operation", () => {
	const before = view(group());
	const after = { ...before, comments: [{ id: "c1", expenseId: "e1", by: "p2", text: "ok", at: 5 }] };
	assert.deepEqual(diffGroup(before, after), [{ k: "c", e: "c1", v: { expenseId: "e1", by: "p2", text: "ok", at: 5 } }]);
});

test("a comment from another phone can't flip the text after it", () => {
	const state = group();
	put(state, "c", "c1", { expenseId: "e1", text: "Paid\u202e 300", at: 1 });
	assert.equal(view(state).comments[0].text, "Paid 300");
});
