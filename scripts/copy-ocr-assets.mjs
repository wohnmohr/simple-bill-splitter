// Copies Tesseract's worker, engine and English model into public/ocr so the
// order scanner loads them from our own origin, only when someone scans.
// Runs before `next dev` and `next build`; public/ocr is not committed.
import { createRequire } from "node:module";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.dirname(require.resolve("tesseract.js/package.json"));
const core = path.dirname(createRequire(path.join(root, "package.json")).resolve("tesseract.js-core/package.json"));
const lang = path.dirname(require.resolve("@tesseract.js-data/eng/package.json"));
const out = path.join(process.cwd(), "public", "ocr");

const files = [
	[path.join(root, "dist", "worker.min.js"), "worker.min.js"],
	// The browser loads whichever of these it supports (LSTM-only engine builds).
	...["tesseract-core-relaxedsimd-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js", "tesseract-core-lstm.wasm.js"].map((f) => [path.join(core, f), f]),
	// The compact integer model: about 3 MB, plenty for printed app screenshots.
	[path.join(lang, "4.0.0_best_int", "eng.traineddata.gz"), "eng.traineddata.gz"],
];

mkdirSync(out, { recursive: true });
for (const [from, name] of files) {
	const to = path.join(out, name);
	if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
	copyFileSync(from, to);
}
console.log(`OCR assets ready in public/ocr (${files.length} files)`);
