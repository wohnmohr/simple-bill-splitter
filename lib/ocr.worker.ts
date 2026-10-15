/// <reference lib="webworker" />
/**
 * The order scanner's engine, off the main thread so the page stays
 * responsive while it reads. Loads ONNX Runtime and the PaddleOCR models from
 * our own origin (/ocr, see scripts/copy-ocr-assets.mjs) on the first scan;
 * the browser caches them after that. Nothing is sent anywhere.
 */
import * as ort from "onnxruntime-web/wasm";
import { readText, type PaddleEngine, type Rgba } from "./paddleOcr";

export type OcrRequest = { id: number; image: Rgba };
export type OcrReply = { id: number; progress: number } | { id: number; text: string } | { id: number; error: string };

// Absolute: bundlers may start this worker from a blob: URL, which keeps our
// origin but can't resolve a relative path.
const BASE = `${self.location.origin}/ocr/`;
ort.env.wasm.wasmPaths = BASE;
// Threads need cross-origin isolation (headers on the scanner's pages, see
// next.config.js); without it, one thread.
ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;

/** Downloads a file, reporting how far along it is. */
async function download(name: string, onBytes: (n: number) => void): Promise<Uint8Array> {
	const res = await fetch(BASE + name);
	if (!res.ok || !res.body) throw new Error(`Couldn't load ${name} (${res.status})`);
	const parts: Uint8Array[] = [];
	const reader = res.body.getReader();
	for (let r = await reader.read(); !r.done; r = await reader.read()) {
		parts.push(r.value);
		onBytes(r.value.length);
	}
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let at = 0;
	for (const p of parts) out.set(p, (at += p.length) - p.length);
	return out;
}

// Roughly the download sizes (bytes), for the progress bar; cached loads finish at once.
const SIZES = { det: 1_327_919, rec: 7_759_723 };
let engine: Promise<PaddleEngine> | null = null;

function load(onProgress: (share: number) => void): Promise<PaddleEngine> {
	engine ??= (async () => {
		let got = 0;
		const tick = (n: number) => onProgress(Math.min(1, (got += n) / (SIZES.det + SIZES.rec)));
		const [det, rec, keys] = await Promise.all([
			download("ppocr-v4-det-int8.onnx", tick).then((b) => ort.InferenceSession.create(b)),
			download("ppocr-v4-rec-int8mm.onnx", tick).then((b) => ort.InferenceSession.create(b)),
			fetch(BASE + "ppocr-v4-keys.txt").then((r) => r.text()),
		]);
		// The recogniser's classes: blank, then every dictionary character, then a space.
		const chars = [...keys.split("\n").filter((l, i, a) => i < a.length - 1 || l), " "];
		return { ort, det, rec, chars };
	})().catch((err) => {
		engine = null; // let the next scan try again
		throw err;
	});
	return engine;
}

self.onmessage = async ({ data }: MessageEvent<OcrRequest>) => {
	const { id, image } = data;
	const post = (msg: OcrReply) => self.postMessage(msg);
	try {
		// Loading counts for the first half of the bar, reading for the second.
		const e = await load((share) => post({ id, progress: share * 0.5 }));
		const text = await readText(e, image, (share) => post({ id, progress: 0.5 + share * 0.5 }));
		post({ id, text });
	} catch (err) {
		post({ id, error: err instanceof Error ? err.message : String(err) });
	}
};
