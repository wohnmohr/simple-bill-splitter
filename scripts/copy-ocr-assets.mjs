// Copies the order scanner's engine (ONNX Runtime, WebAssembly) and its
// PaddleOCR models (models/ocr, see its README) into public/ocr, so they load from our own origin, only
// when someone scans. Runs before `next dev` and `next build`; public/ocr is
// not committed. Anything else in public/ocr (an older engine) is removed.
import { createRequire } from "node:module";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const models = path.join(process.cwd(), "models", "ocr");
const out = path.join(process.cwd(), "public", "ocr");

// Published names carry the model version: a new model gets a new URL, so the
// long cache on /ocr never serves a stale one.
const files = [
	[require.resolve("onnxruntime-web/ort-wasm-simd-threaded.wasm"), "ort-wasm-simd-threaded.wasm"],
	[require.resolve("onnxruntime-web/ort-wasm-simd-threaded.mjs"), "ort-wasm-simd-threaded.mjs"],
	...["ppocr-v4-det-int8.onnx", "ppocr-v4-rec-int8mm.onnx", "ppocr-v4-keys.txt"].map((f) => [path.join(models, f), f]),
];

mkdirSync(out, { recursive: true });
const keep = new Set([...files.map(([, name]) => name), "manifest.json"]);
for (const name of readdirSync(out)) if (!keep.has(name)) rmSync(path.join(out, name));
for (const [from, name] of files) {
	const to = path.join(out, name);
	if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
	copyFileSync(from, to);
}
// Exact sizes, so the scanner's progress bar counts real bytes against real totals.
writeFileSync(path.join(out, "manifest.json"), JSON.stringify(Object.fromEntries(files.map(([, name]) => [name, statSync(path.join(out, name)).size]))));
console.log(`OCR assets ready in public/ocr (${files.length} files)`);
