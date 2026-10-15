/**
 * PaddleOCR on ONNX Runtime, small enough to run on a phone and with no
 * other dependencies: finds the text on an image (DB detection), reads each
 * piece (CTC recognition), and puts the pieces back into rows, so a bill
 * line's label and its price stay on one line, however far apart they sit.
 *
 * App screenshots have straight, horizontal text, so boxes are upright
 * rectangles: no OpenCV, no rotation. Pure functions over RGBA pixels; the
 * caller supplies onnxruntime and the loaded models, so this runs the same
 * in the browser and in Node tests.
 */
import type * as Ort from "onnxruntime-web";

export type Rgba = { data: Uint8ClampedArray | Uint8Array; width: number; height: number };

export type PaddleEngine = {
	ort: typeof Ort;
	det: Ort.InferenceSession;
	rec: Ort.InferenceSession;
	/** The recogniser's characters, in order (class 0 is CTC's blank). */
	chars: string[];
};

type Box = { x0: number; y0: number; x1: number; y1: number };

/** Where reading has got to: finding the text, then reading line `done` of `total`. */
export type ReadProgress = { stage: "detect" | "read"; done: number; total: number };
type Piece = Box & { text: string };

/** Detection works on the image scaled to fit this (in pixels, a multiple of 32). */
const DET_MAX_SIDE = 1280; // as accurate as 1600 on our test bills, and quicker
const REC_HEIGHT = 48;

/** The text of an image, as rows of text top to bottom. */
export async function readText(engine: PaddleEngine, img: Rgba, onProgress?: (p: ReadProgress) => void): Promise<string> {
	onProgress?.({ stage: "detect", done: 0, total: 1 });
	const boxes = await detect(engine, img);
	onProgress?.({ stage: "read", done: 0, total: boxes.length });
	const pieces: Piece[] = [];
	for (let i = 0; i < boxes.length; i++) {
		const text = await recognise(engine, img, boxes[i]);
		if (text.trim()) pieces.push({ ...boxes[i], text: text.trim() });
		onProgress?.({ stage: "read", done: i + 1, total: boxes.length });
	}
	return toRows(pieces);
}

/** Text boxes, from DB detection's probability map. */
async function detect({ ort, det }: PaddleEngine, img: Rgba): Promise<Box[]> {
	const scale = Math.min(1, DET_MAX_SIDE / Math.max(img.width, img.height));
	const w = Math.max(32, Math.round((img.width * scale) / 32) * 32);
	const h = Math.max(32, Math.round((img.height * scale) / 32) * 32);
	const input = toTensor(img, { x0: 0, y0: 0, x1: img.width, y1: img.height }, w, h, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]);
	const out = await det.run({ [det.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, h, w]) });
	const prob = out[det.outputNames[0]].data as Float32Array;

	// Connected regions above the threshold, each one a piece of text.
	const seen = new Uint8Array(w * h);
	const stack: number[] = [];
	const boxes: Box[] = [];
	const sx = img.width / w;
	const sy = img.height / h;
	for (let start = 0; start < w * h; start++) {
		if (seen[start] || prob[start] < 0.3) continue;
		let x0 = w, y0 = h, x1 = 0, y1 = 0, sum = 0, n = 0;
		stack.push(start);
		seen[start] = 1;
		while (stack.length) {
			const p = stack.pop()!;
			const x = p % w;
			const y = (p - x) / w;
			x0 = Math.min(x0, x); x1 = Math.max(x1, x);
			y0 = Math.min(y0, y); y1 = Math.max(y1, y);
			sum += prob[p];
			n++;
			for (const q of [p - 1, p + 1, p - w, p + w]) {
				if (q < 0 || q >= w * h || seen[q] || prob[q] < 0.3) continue;
				if ((q === p - 1 || q === p + 1) && Math.floor(q / w) !== y) continue; // no wrapping across rows
				seen[q] = 1;
				stack.push(q);
			}
		}
		const bw = x1 - x0 + 1;
		const bh = y1 - y0 + 1;
		if (n < 10 || bh < 3 || sum / n < 0.6) continue;
		// DB shrinks text regions when training; grow them back ("unclip", ratio 1.5).
		const d = (bw * bh * 1.5) / (2 * (bw + bh));
		boxes.push({
			x0: Math.max(0, (x0 - d) * sx),
			y0: Math.max(0, (y0 - d) * sy),
			x1: Math.min(img.width, (x1 + 1 + d) * sx),
			y1: Math.min(img.height, (y1 + 1 + d) * sy),
		});
	}
	return boxes;
}

/** Reads one box: greedy CTC decoding of the recogniser's output. */
async function recognise({ ort, rec, chars }: PaddleEngine, img: Rgba, box: Box): Promise<string> {
	const bw = box.x1 - box.x0;
	const bh = box.y1 - box.y0;
	const w = Math.min(3200, Math.max(16, Math.ceil((REC_HEIGHT * bw) / bh)));
	const input = toTensor(img, box, w, REC_HEIGHT, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]);
	const out = await rec.run({ [rec.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, REC_HEIGHT, w]) });
	const t = out[rec.outputNames[0]];
	const [, steps, classes] = t.dims;
	const p = t.data as Float32Array;
	let text = "";
	let prev = 0;
	for (let s = 0; s < steps; s++) {
		let best = 0;
		for (let c = 1; c < classes; c++) if (p[s * classes + c] > p[s * classes + best]) best = c;
		if (best !== 0 && best !== prev) text += chars[best - 1] ?? "";
		prev = best;
	}
	return text;
}

/**
 * Crops `box` out of the image, resizes it to w×h (bilinear) and returns it
 * as a normalised CHW float tensor in BGR order, as PaddleOCR was trained.
 */
function toTensor(img: Rgba, box: Box, w: number, h: number, mean: number[], std: number[]): Float32Array {
	const out = new Float32Array(3 * w * h);
	const plane = w * h;
	const fx = (box.x1 - box.x0) / w;
	const fy = (box.y1 - box.y0) / h;
	const { data, width, height } = img;
	for (let y = 0; y < h; y++) {
		const sy = Math.min(height - 1, Math.max(0, box.y0 + (y + 0.5) * fy - 0.5));
		const yA = Math.floor(sy);
		const yB = Math.min(height - 1, yA + 1);
		const ty = sy - yA;
		for (let x = 0; x < w; x++) {
			const sx = Math.min(width - 1, Math.max(0, box.x0 + (x + 0.5) * fx - 0.5));
			const xA = Math.floor(sx);
			const xB = Math.min(width - 1, xA + 1);
			const tx = sx - xA;
			for (let c = 0; c < 3; c++) {
				const rgb = 2 - c; // BGR
				const v =
					(data[(yA * width + xA) * 4 + rgb] * (1 - tx) + data[(yA * width + xB) * 4 + rgb] * tx) * (1 - ty) +
					(data[(yB * width + xA) * 4 + rgb] * (1 - tx) + data[(yB * width + xB) * 4 + rgb] * tx) * ty;
				out[c * plane + y * w + x] = (v / 255 - mean[c]) / std[c];
			}
		}
	}
	return out;
}

/** Puts pieces back into rows: same row if they overlap by half their height. */
function toRows(pieces: Piece[]): string {
	const rows: Piece[][] = [];
	for (const p of [...pieces].sort((a, b) => a.y0 + a.y1 - (b.y0 + b.y1))) {
		const row = rows.find((r) => {
			const top = Math.max(...r.map((q) => q.y0));
			const bottom = Math.min(...r.map((q) => q.y1));
			const overlap = Math.min(bottom, p.y1) - Math.max(top, p.y0);
			return overlap > 0.5 * Math.min(p.y1 - p.y0, bottom - top);
		});
		if (row) row.push(p);
		else rows.push([p]);
	}
	return rows
		.map((r) => r.sort((a, b) => a.x0 - b.x0).map((p) => p.text).join("   "))
		.join("\n");
}
