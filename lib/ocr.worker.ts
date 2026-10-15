/// <reference lib="webworker" />
/**
 * The order scanner's engine, off the main thread so the page stays
 * responsive while it reads. Loads ONNX Runtime and the PaddleOCR models from
 * our own origin (/ocr, see scripts/copy-ocr-assets.mjs) on the first scan;
 * the browser caches them after that. Nothing is sent anywhere.
 */
import * as ort from "onnxruntime-web/wasm";
import { readText, type PaddleEngine, type ReadProgress, type Rgba } from "./paddleOcr";

/** What the engine is doing: downloading (bytes), starting up, or reading (see ReadProgress). */
export type OcrProgress = { stage: "download" | "start"; done: number; total: number } | ReadProgress;
export type OcrRequest = { id: number; image: Rgba };
export type OcrReply = { id: number; progress: OcrProgress } | { id: number; text: string } | { id: number; error: string };

// Absolute: bundlers may start this worker from a blob: URL, which keeps our
// origin but can't resolve a relative path.
const BASE = `${self.location.origin}/ocr/`;
ort.env.wasm.wasmPaths = BASE;
// Threads need cross-origin isolation (headers on the scanner's pages, see
// next.config.js); without it, one thread.
ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;

let engine: Promise<PaddleEngine> | null = null;

/**
 * Downloads files together, reporting real bytes against exact sizes from
 * the build's manifest. Includes the engine itself, so nothing loads unseen.
 */
async function downloadAll(names: string[], onProgress: (p: OcrProgress) => void): Promise<Uint8Array[]> {
	const sizes: Record<string, number> = await fetch(BASE + "manifest.json").then((r) => r.json());
	const total = names.reduce((n, name) => n + (sizes[name] ?? 0), 0);
	let done = 0;
	onProgress({ stage: "download", done, total });
	return Promise.all(
		names.map(async (name) => {
			const res = await fetch(BASE + name);
			if (!res.ok || !res.body) throw new Error(`Couldn't load ${name} (${res.status})`);
			const parts: Uint8Array[] = [];
			const reader = res.body.getReader();
			for (let r = await reader.read(); !r.done; r = await reader.read()) {
				parts.push(r.value);
				done += r.value.length;
				onProgress({ stage: "download", done, total: Math.max(total, done) });
			}
			const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
			let at = 0;
			for (const p of parts) out.set(p, (at += p.length) - p.length);
			return out;
		})
	);
}

function load(onProgress: (p: OcrProgress) => void): Promise<PaddleEngine> {
	engine ??= (async () => {
		const [wasm, detModel, recModel] = await downloadAll(
			["ort-wasm-simd-threaded.wasm", "ppocr-v4-det-int8.onnx", "ppocr-v4-rec-int8mm.onnx"],
			onProgress
		);
		onProgress({ stage: "start", done: 0, total: 1 });
		ort.env.wasm.wasmBinary = wasm;
		const [det, rec, keys] = await Promise.all([
			ort.InferenceSession.create(detModel),
			ort.InferenceSession.create(recModel),
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
	const progress = (p: OcrProgress) => post({ id, progress: p });
	try {
		const text = await readText(await load(progress), image, progress);
		post({ id, text });
	} catch (err) {
		post({ id, error: err instanceof Error ? err.message : String(err) });
	}
};
