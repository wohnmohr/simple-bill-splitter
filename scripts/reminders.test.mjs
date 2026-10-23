// Tests for the home screen's "Still waiting on" reminders.
//   node --test --experimental-strip-types scripts/reminders.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./fixtures/alias.mjs", import.meta.url);
const { dueReminders, reminderKey } = await import("../utils/reminders.ts");

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 23);
const INR = { code: "INR", symbol: "₹", name: "Indian Rupee" };
const members = [{ id: "me", name: "Asha", upiId: "asha@okaxis" }, { id: "p2", name: "Riya" }, { id: "p3", name: "Kabir" }];
// I paid `amount` `daysAgo`, split equally three ways.
const group = (id, amount, daysAgo, extra = {}) => ({
	id,
	name: `Group ${id}`,
	currency: INR,
	members,
	meId: "me",
	expenses: [{ id: `${id}-e`, amount, paidBy: "me", participants: ["me", "p2", "p3"], splitMethod: "equally", createdAt: NOW - daysAgo * DAY }],
	...extra,
});

test("lists what's owed to you in quiet groups, biggest first", () => {
	const due = dueReminders([group("a", 300, 5), group("b", 900, 4)], {}, NOW);
	assert.deepEqual(
		due.map((d) => [d.group.id, d.settlement.amount, d.days]),
		[["b", 300, 4], ["b", 300, 4], ["a", 100, 5], ["a", 100, 5]]
	);
	assert.deepEqual(due.map((d) => d.settlement.from).sort(), ["p2", "p2", "p3", "p3"]);
});

test("skips busy, closed and anonymous groups, money you owe, and anyone reminded lately", () => {
	const owedByMe = { ...group("d", 300, 5), expenses: [{ ...group("d", 300, 5).expenses[0], paidBy: "p2" }] };
	assert.deepEqual(dueReminders([group("a", 300, 1), group("b", 300, 9, { closedAt: 1 }), group("c", 300, 9, { meId: null }), owedByMe], {}, NOW), []);
	const reminded = { [reminderKey("a", "p2")]: NOW - DAY };
	assert.deepEqual(dueReminders([group("a", 300, 5)], reminded, NOW).map((d) => d.settlement.from), ["p3"]);
	assert.equal(dueReminders([group("a", 300, 5)], { [reminderKey("a", "p2")]: NOW - 4 * DAY }, NOW).length, 2);
});
