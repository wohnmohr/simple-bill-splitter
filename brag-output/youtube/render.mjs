// Renders banner.html to the YouTube channel-art PNG (2560x1440), plus
// previews of what desktop and phones show, for checking the crop.
//   node brag-output/youtube/render.mjs [banner-dir]   (needs playwright-core and a Chromium)
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.resolve(process.argv[2] || path.dirname(fileURLToPath(import.meta.url)));
const page = `file://${dir}/banner.html`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await browser.newPage({ viewport: { width: 2560, height: 1440 } });

await p.goto(page);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: `${dir}/splitbiller-youtube-banner.png` });
// What each device shows.
await p.screenshot({ path: `${dir}/preview-desktop.png`, clip: { x: 0, y: 508, width: 2560, height: 423 } });
await p.screenshot({ path: `${dir}/preview-phone.png`, clip: { x: 507, y: 508, width: 1546, height: 423 } });
await p.goto(`${page}?guides`);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: `${dir}/preview-guides.png` });
await browser.close();
