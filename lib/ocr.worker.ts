/// <reference lib="webworker" />
/**
 * The order scanner's engine, off the main thread so the page stays
 * responsive while it reads. Loads ONNX Runtime and the PaddleOCR models from
 * our own origin (/ocr, see scripts/copy-ocr-assets.mjs) on the first scan;
 * the browser caches them after that. Nothing is sent anywhere.
 */
import * as ort from "onnxruntime-web/wasm";
import { readText, type PaddleEngine, type ReadProgress, type Rgba } from "./paddleOcr";

/**
 * What the engine is doing: downloading (bytes), loading from the browser's
 * cache (bytes, on a repeat visit), starting up, or reading (see ReadProgress).
 */
export type OcrProgress = { stage: "download" | "load" | "start"; done: number; total: number } | ReadProgress;
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
 * Downloads files together, reporting real bytes against each file's size.
 * Includes the engine itself, so nothing loads unseen. When the browser's
 * cache already holds every file (a repeat visit), it says "load", not
 * "download": nothing comes over the network.
 */
async function downloadAll(names: string[], onProgress: (p: OcrProgress) => void): Promise<Uint8Array[]> {
	// The manifest isn't versioned like the files, so it's revalidated; if it's
	// missing or stale, a file's own Content-Length stands in for its size. Only
	// the bar depends on it: a scan never fails over a manifest.
	const manifest: Record<string, number> = await fetch(BASE + "manifest.json", { cache: "no-cache" })
		.then((r) => (r.ok ? r.json() : {}))
		.catch(() => ({}));
	// Ask the cache first; a miss rejects at once, and only those go to the network.
	const cached = await Promise.all(
		names.map((name) => fetch(BASE + name, { cache: "only-if-cached", mode: "same-origin" }).then((r) => (r.ok ? r : null), () => null))
	);
	const stage = cached.every(Boolean) ? "load" : "download";
	const sizes = names.map((name) => manifest[name] ?? 0);
	const got = names.map(() => 0);
	const report = () => {
		let done = 0, total = 0;
		for (let i = 0; i < names.length; i++) {
			done += got[i];
			total += Math.max(sizes[i], got[i]);
		}
		onProgress({ stage, done, total });
	};
	report();
	return Promise.all(
		names.map(async (name, i) => {
			const res = cached[i] ?? (await fetch(BASE + name));
			if (!res.ok || !res.body) throw new Error(`Couldn't load ${name} (${res.status})`);
			// A compressed response's Content-Length counts the wrong bytes.
			if (!sizes[i] && !res.headers.get("content-encoding")) sizes[i] = Number(res.headers.get("content-length")) || 0;
			const parts: Uint8Array[] = [];
			const reader = res.body.getReader();
			for (let r = await reader.read(); !r.done; r = await reader.read()) {
				parts.push(r.value);
				got[i] += r.value.length;
				report();
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
