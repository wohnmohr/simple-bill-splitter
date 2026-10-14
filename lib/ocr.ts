/**
 * Reads the text of an image on the device, with Tesseract compiled to
 * WebAssembly. The image never leaves the browser: the engine and the
 * English model are fetched from our own origin (public/ocr) the first time
 * someone scans, then cached by the browser.
 */
import type { Worker } from "tesseract.js";

const BASE = "/ocr";

let worker: Promise<Worker> | null = null;
let onProgress: ((share: number) => void) | null = null;

function getWorker(): Promise<Worker> {
	worker ??= (async () => {
		const { createWorker, OEM, PSM } = await import("tesseract.js");
		const w = await createWorker("eng", OEM.LSTM_ONLY, {
			workerPath: `${BASE}/worker.min.js`,
			corePath: BASE,
			langPath: BASE,
			workerBlobURL: false,
			logger: (m) => {
				// Loading the model counts for the first half, reading for the second.
				const loading = m.status.startsWith("loading") || m.status.startsWith("initializ");
				onProgress?.(loading ? m.progress * 0.5 : 0.5 + m.progress * 0.5);
			},
		});
		// One block of text: keeps each label on the same line as its amount.
		await w.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK, preserve_interword_spaces: "1" });
		return w;
	})().catch((err) => {
		worker = null; // let the next attempt start over
		throw err;
	});
	return worker;
}

/**
 * Prepares a screenshot for OCR: small images are enlarged, and dark-mode
 * screenshots are inverted to dark text on light.
 */
async function prepare(file: Blob): Promise<HTMLCanvasElement> {
	const bitmap = await createImageBitmap(file);
	const scale = bitmap.width < 1000 ? Math.min(2, 1200 / bitmap.width) : 1;
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
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
		ctx.putImageData(img, 0, 0);
	}
	return canvas;
}

/** The text of an image, read on this device. `progress` gets 0–1. */
export async function readImageText(file: Blob, progress?: (share: number) => void): Promise<string> {
	onProgress = progress ?? null;
	try {
		const [w, canvas] = await Promise.all([getWorker(), prepare(file)]);
		const { data } = await w.recognize(canvas);
		return data.text;
	} finally {
		onProgress = null;
	}
}
