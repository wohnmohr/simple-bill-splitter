/**
 * Reads the text of an image on the device, with PaddleOCR running in a Web
 * Worker (lib/ocr.worker.ts). The image never leaves the browser: the engine
 * and models come from our own origin the first time someone scans, then the
 * browser caches them.
 */
import type { OcrProgress, OcrReply, OcrRequest } from "./ocr.worker";
import type { Rgba } from "./paddleOcr";

/** Big photos are scaled down to this (longest side, px): plenty for text, kind to memory. */
const MAX_SIDE = 2048;

let worker: Worker | null = null;
let nextId = 0;
let loaded = false; // the engine is up in this page: no download or start-up next time
let fromCache = false; // this scan's engine files came from the browser's cache

/** How far along a scan is (0–1), and what it's doing, in words. */
export type ScanProgress = { share: number; step: string };

// Each stage's slice of the bar, roughly in proportion to the time it takes:
// on the first visit mostly the download; on a repeat visit a short load from
// the browser's cache; on a later scan in the same page, mostly reading lines.
type Stage = OcrProgress["stage"] | "prepare";
const FIRST: Record<Stage, [number, number]> = {
	prepare: [0, 0.02],
	download: [0.02, 0.6],
	load: [0.02, 0.6],
	start: [0.6, 0.66],
	detect: [0.66, 0.74],
	read: [0.74, 1],
};
const CACHED: typeof FIRST = { prepare: [0, 0.03], download: [0.03, 0.15], load: [0.03, 0.15], start: [0.15, 0.25], detect: [0.25, 0.4], read: [0.4, 1] };
const AGAIN: typeof FIRST = { prepare: [0, 0.03], download: [0.03, 0.03], load: [0.03, 0.03], start: [0.03, 0.03], detect: [0.03, 0.2], read: [0.2, 1] };

function describe(p: OcrProgress | { stage: "prepare"; done: 0; total: 1 }): ScanProgress {
	if (p.stage === "load") fromCache = true;
	const [from, to] = (loaded ? AGAIN : fromCache ? CACHED : FIRST)[p.stage];
	const share = from + (to - from) * (p.total ? Math.min(1, p.done / p.total) : 0);
	const step =
		p.stage === "prepare" ? "Preparing the screenshot…"
		: p.stage === "download" ? `Downloading the reader, first time only: ${Math.round((100 * p.done) / (p.total || 1))}%`
		: p.stage === "load" ? "Loading the reader…"
		: p.stage === "start" ? "Starting the reader…"
		: p.stage === "detect" ? "Finding the text…"
		: `Reading line ${Math.min(p.total, p.done + 1)} of ${p.total}…`;
	return { share, step };
}

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

/** The text of an image, read on this device. `progress` hears each step as it happens. */
export async function readImageText(file: Blob, progress?: (p: ScanProgress) => void): Promise<string> {
	fromCache = false;
	progress?.(describe({ stage: "prepare", done: 0, total: 1 }));
	const image = await prepare(file);
	worker ??= new Worker(new URL("./ocr.worker.ts", import.meta.url), { type: "module" });
	const id = ++nextId;
	const w = worker;
	return new Promise((resolve, reject) => {
		const onMessage = ({ data }: MessageEvent<OcrReply>) => {
			if (data.id !== id) return;
			if ("progress" in data) return progress?.(describe(data.progress));
			w.removeEventListener("message", onMessage);
			if ("text" in data) {
				loaded = true;
				resolve(data.text);
			} else reject(new Error(data.error));
		};
		w.addEventListener("message", onMessage);
		w.postMessage({ id, image } satisfies OcrRequest, [image.data.buffer]);
	});
}
