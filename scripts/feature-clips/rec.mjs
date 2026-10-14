/**
 * Records the /features clips: Chrome screencast frames (with their real
 * timing) → a looping H.264 MP4 and a WebP poster in public/features/.
 *
 * Needs ffmpeg and playwright-core. Run against a production build:
 *   pnpm build && pnpm start            # in one terminal
 *   node scripts/feature-clips/clips.mjs [clip …]
 * Env: SITE_URL (default http://localhost:3000), CHROME_PATH (a Chromium/Chrome binary).
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const BASE = process.env.SITE_URL || "http://localhost:3000";
export const W = 390, H = 760;
const SCRATCH = join(tmpdir(), "splitbiller-feature-clips");
export const OUT = fileURLToPath(new URL("../../public/features", import.meta.url));

export const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });

// A soft ripple wherever the "finger" taps, and no feedback nudge mid-clip.
const INIT = () => {
	try {
		if (!localStorage.getItem("splitbiller-feedback-nudge"))
			localStorage.setItem("splitbiller-feedback-nudge", JSON.stringify({ at: Date.now(), outcome: "answered" }));
	} catch {}
	addEventListener(
		"pointerdown",
		(e) => {
			const d = document.createElement("div");
			d.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;background:rgba(126,79,176,.28);border:2px solid rgba(255,255,255,.95);box-shadow:0 0 0 1px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.2);pointer-events:none;z-index:2147483647;transform:scale(.55);opacity:1;transition:transform .4s cubic-bezier(.2,.7,.3,1),opacity .55s ease-out .1s`;
			document.documentElement.appendChild(d);
			requestAnimationFrame(() => requestAnimationFrame(() => { d.style.transform = "scale(1.15)"; d.style.opacity = "0"; }));
			setTimeout(() => d.remove(), 800);
		},
		true
	);
};

export async function phone(extra = {}) {
	const ctx = await browser.newContext({
		viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
		permissions: ["clipboard-read", "clipboard-write"], ...extra,
	});
	await ctx.addInitScript(INIT);
	const page = await ctx.newPage();
	page.errors = [];
	page.on("pageerror", (e) => page.errors.push(e.message));
	return page;
}

export const beat = (page, ms = 600) => page.waitForTimeout(ms);
/** Types like a person. */
export const type = async (locator, text, delay = 85) => { await locator.click(); await locator.pressSequentially(text, { delay }); };

/** Starts capturing a page. Returns stop() → { frames, t0, t1 }. */
export async function capture(page) {
	const cdp = await page.context().newCDPSession(page);
	const frames = [];
	cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
		frames.push({ data, t: metadata.timestamp });
		cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
	});
	await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W * 2, maxHeight: H * 2 });
	await page.waitForTimeout(150);
	const t0 = Date.now() / 1000;
	return {
		stop: async () => {
			const t1 = Date.now() / 1000;
			await cdp.send("Page.stopScreencast").catch(() => {});
			return { frames, t0, t1 };
		},
	};
}

/** Writes frames between t0..t1 as a concat list with real durations. */
function frameList(dir, { frames }, t0, t1) {
	mkdirSync(dir, { recursive: true });
	// The frame on screen at t0 is the last one that arrived at or before it.
	let start = 0;
	for (let i = 0; i < frames.length; i++) if (frames[i].t <= t0) start = i;
	const kept = frames.slice(start).filter((f, i) => i === 0 || f.t < t1);
	let list = "ffconcat version 1.0\n";
	kept.forEach((f, i) => {
		const file = join(dir, `${String(i).padStart(5, "0")}.jpg`);
		writeFileSync(file, Buffer.from(f.data, "base64"));
		const from = Math.max(f.t, t0), to = i + 1 < kept.length ? kept[i + 1].t : t1;
		list += `file '${file}'\nduration ${Math.max(0.001, to - from).toFixed(4)}\n`;
	});
	list += `file '${join(dir, `${String(kept.length - 1).padStart(5, "0")}.jpg`)}'\n`;
	writeFileSync(join(dir, "list.txt"), list);
	return join(dir, "list.txt");
}

const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
const x264 = ["-c:v", "libx264", "-preset", "veryslow", "-crf", "28", "-tune", "animation", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an"];

/**
 * Encodes one or two captures (side by side, split by a hairline) to
 * public/features/<name>.mp4 and a poster from `posterAt` seconds (default: the end).
 */
export function encode(name, captures, { posterAt } = {}) {
	const work = join(SCRATCH, name);
	rmSync(work, { recursive: true, force: true });
	const t0 = Math.max(...captures.map((c) => c.t0)), t1 = Math.min(...captures.map((c) => c.t1));
	const lists = captures.map((c, i) => frameList(join(work, `p${i}`), c, t0, t1));
	const scaleW = 540; // per phone
	const inputs = lists.flatMap((l) => ["-f", "concat", "-safe", "0", "-i", l]);
	const per = (i) => `[${i}:v]fps=30,scale=${scaleW}:-2:flags=lanczos,setsar=1[v${i}]`;
	const graph = lists.length === 1
		? `${per(0)};[v0]null[out]`
		: `${per(0)};${per(1)};[v0]pad=iw+2:ih:0:0:color=0xe7e3ea[a];[a][v1]hstack=inputs=2[out]`;
	const mp4 = join(OUT, `${name}.mp4`);
	mkdirSync(OUT, { recursive: true });
	ff([...inputs, "-filter_complex", graph, "-map", "[out]", ...x264, mp4]);
	const dur = t1 - t0;
	const at = Math.min(Math.max(0, posterAt ?? dur - 0.2), dur - 0.05);
	ff(["-ss", at.toFixed(2), "-i", mp4, "-frames:v", "1", "-c:v", "libwebp", "-quality", "82", join(OUT, `${name}.webp`)]);
	const info = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", mp4]).toString().trim();
	const size = execFileSync("du", ["-k", mp4]).toString().split("\t")[0];
	console.log(`${name}: ${dur.toFixed(1)}s ${info} ${size}KB`);
	return { duration: dur, size: info };
}
