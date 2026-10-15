/**
 * Reads the text of an image on the device, with PaddleOCR running in a Web
 * Worker (lib/ocr.worker.ts). The image never leaves the browser: the engine
 * and models come from our own origin the first time someone scans, then the
 * browser caches them.
 */
import type { OcrReply, OcrRequest } from "./ocr.worker";
import type { Rgba } from "./paddleOcr";

/** Big photos are scaled down to this (longest side, px): plenty for text, kind to memory. */
const MAX_SIDE = 2048;

let worker: Worker | null = null;
let nextId = 0;

/**
 * Prepares an image for reading: scales big photos down, and inverts
 * dark-mode screenshots to dark text on light, which the models read best.
 */
async function prepare(file: Blob): Promise<Rgba> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
	const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
	const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();

	const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const px = img.data;
	let sum = 0;
	for (let i = 0; i < px.length; i += 4 * 16) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
	if (sum / (px.length / (4 * 16)) < 110) {
		for (let i = 0; i < px.length; i += 4) {
			px[i] = 255 - px[i];
			px[i + 1] = 255 - px[i + 1];
			px[i + 2] = 255 - px[i + 2];
		}
	}
	return { data: px, width: img.width, height: img.height };
}

/** The text of an image, read on this device. `progress` gets 0–1. */
export async function readImageText(file: Blob, progress?: (share: number) => void): Promise<string> {
	const image = await prepare(file);
	worker ??= new Worker(new URL("./ocr.worker.ts", import.meta.url), { type: "module" });
	const id = ++nextId;
	const w = worker;
	return new Promise((resolve, reject) => {
		const onMessage = ({ data }: MessageEvent<OcrReply>) => {
			if (data.id !== id) return;
			if ("progress" in data) return progress?.(data.progress);
			w.removeEventListener("message", onMessage);
			if ("text" in data) resolve(data.text);
			else reject(new Error(data.error));
		};
		w.addEventListener("message", onMessage);
		w.postMessage({ id, image } satisfies OcrRequest, [image.data.buffer]);
	});
}
