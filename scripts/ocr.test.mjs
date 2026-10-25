// Tests for how a scan fails: an image that won't open, and a reader worker that won't load.
//   node --test --experimental-strip-types scripts/ocr.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { readImageText, UnreadableImageError } = await import("../lib/ocr.ts");
const { POST: shareTarget } = await import("../app/share-target/route.ts");

// A 1x1 white image, as far as prepare() can tell.
const openableImage = () => {
	globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} });
	globalThis.OffscreenCanvas = class {
		constructor(width, height) {
			Object.assign(this, { width, height });
		}
		getContext() {
			return { drawImage() {}, getImageData: (_x, _y, width, height) => ({ data: new Uint8ClampedArray(4 * width * height).fill(255), width, height }) };
		}
	};
};

test("an image the browser can't decode fails as unreadable, not as a scanner problem", async () => {
	globalThis.createImageBitmap = async () => {
		throw new Error("The source image could not be decoded.");
	};
	await assert.rejects(readImageText(new Blob(["junk"], { type: "image/png" })), UnreadableImageError);
});

test("a reader worker that fails to load ends the scan, and the next scan starts a new worker", async () => {
	openableImage();
	const workers = [];
	globalThis.Worker = class extends EventTarget {
		constructor() {
			super();
			workers.push(this);
		}
		postMessage() {
			setTimeout(() => this.dispatchEvent(new Event("error")));
		}
		terminate() {
			this.terminated = true;
		}
	};
	const blob = new Blob(["png"], { type: "image/png" });
	await assert.rejects(readImageText(blob), /worker failed/);
	assert.equal(workers[0].terminated, true);
	await assert.rejects(readImageText(blob), /worker failed/);
	assert.equal(workers.length, 2);
});

test("a share that reaches the server (no service worker yet) still opens Add expense", () => {
	const res = shareTarget();
	assert.equal(res.status, 303);
	assert.equal(res.headers.get("location"), "/dashboard?add");
});
