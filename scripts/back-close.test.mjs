// Tests for the phone/browser Back button closing sheets and the open group (utils/backStack.ts).
//   node --test --experimental-strip-types scripts/back-close.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as wait } from "node:timers/promises";

// A browser's session history on one URL: entries, the current one, and popstate on traversal.
const entries = [{ base: true }];
let at = 0;
const listeners = [];
globalThis.window = {
	addEventListener: (type, fn) => type === "popstate" && listeners.push(fn),
	history: {
		get state() {
			return entries[at];
		},
		pushState(state) {
			entries.splice(at + 1, Infinity, state);
			at++;
		},
		go(delta) {
			setTimeout(() => {
				at = Math.max(0, Math.min(entries.length - 1, at + delta));
				listeners.forEach((fn) => fn());
			});
		},
	},
};
// Lets every queued timer run, and the timers those queue: a timer set later always fires later, so this
// can't lose a race on a slow machine the way a fixed delay can.
const tick = async () => {
	for (let i = 0; i < 4; i++) await wait(0);
};
const back = async () => {
	window.history.go(-1);
	await tick();
};
const forward = async () => {
	window.history.go(1);
	await tick();
};

const { openLayer } = await import("../utils/backStack.ts");

// A layer as a component holds it: open until Back or the app closes it.
const layer = (under) => {
	const l = { open: true, release: null };
	l.release = openLayer(() => (l.open = false), under);
	l.closeInApp = () => {
		l.open = false;
		l.release();
	};
	return l;
};

test("Back closes the sheet, then the group, then leaves", async () => {
	const group = layer(true);
	await tick();
	const sheet = layer();
	await tick();
	assert.equal(at, 2);
	await back();
	assert.deepEqual([group.open, sheet.open], [true, false]);
	sheet.release();
	await back();
	assert.equal(group.open, false);
	group.release();
	await tick();
	assert.equal(at, 0, "the next Back leaves the page");
});

test("a group and its sheet opened together still close sheet first", async () => {
	// Child effects run first, so the sheet registers before the group.
	const sheet = layer();
	const group = layer(true);
	await tick();
	await back();
	assert.deepEqual([group.open, sheet.open], [true, false]);
	await back();
	assert.equal(group.open, false);
	await tick();
	assert.equal(at, 0);
});

test("closing in the app steps back over its entry, so Back isn't spent on nothing", async () => {
	const group = layer(true);
	const sheet = layer();
	await tick();
	assert.equal(at, 2);
	sheet.closeInApp();
	await tick();
	assert.equal(at, 1);
	group.closeInApp();
	await tick();
	assert.equal(at, 0);
});

test("one sheet swapped for another (View, then Edit) keeps a single entry", async () => {
	const view = layer();
	await tick();
	view.closeInApp();
	const edit = layer();
	await tick();
	assert.equal(at, 1);
	await back();
	assert.equal(edit.open, false);
	await tick();
	assert.equal(at, 0);
});

test("Forward into an entry nothing holds is stepped back", async () => {
	const sheet = layer();
	await tick();
	await back();
	assert.equal(sheet.open, false);
	await forward();
	await tick();
	assert.equal(at, 0);
	assert.ok(entries.every((e) => e.base || Object.keys(e).join() === "sbLayer"), "history holds only depths, never group data");
});
