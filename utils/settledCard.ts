import type { Currency } from "@/types";
import { type Award, awardDetail } from "@/utils/awards";
import { formatCurrency } from "@/utils/formatting";

export const CARD_W = 1080;
export const CARD_H = 1920;

export type SettledCardData = {
	groupName: string;
	currency: Currency;
	/** Facts for the top of the card: total spent, people, expenses, days. */
	total: number;
	people: number;
	count: number;
	days: number;
	awards: Award[];
	/** Whose card it is: their award leads. */
	forId: string;
	nameOf: (id: string) => string;
	/** Off for a card that shows no money. */
	amounts: boolean;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The page's palette and font, so the card wears the group's theme. */
const look = () => {
	const style = getComputedStyle(document.documentElement);
	const color = (token: string, fallback: string) => {
		const v = style.getPropertyValue(`--sb-${token}`).trim();
		return v ? `rgb(${v})` : fallback;
	};
	const font = getComputedStyle(document.body).getPropertyValue("--font-outfit").trim() || "system-ui, sans-serif";
	return { from: color("brand-700", "#5b3390"), to: color("brand-950", "#1f1030"), soft: color("brand-200", "#dccbef"), font };
};

/** Lines of at most `width` pixels, cut with an ellipsis after `max` lines. */
const wrap = (ctx: CanvasRenderingContext2D, text: string, width: number, max: number) => {
	const lines: string[] = [];
	let line = "";
	for (const word of text.split(/\s+/)) {
		const next = line ? `${line} ${word}` : word;
		if (ctx.measureText(next).width <= width || !line) line = next;
		else {
			lines.push(line);
			line = word;
		}
	}
	if (line) lines.push(line);
	if (lines.length > max) {
		lines.length = max;
		let last = lines[max - 1];
		while (last && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1);
		lines[max - 1] = `${last}…`;
	}
	return lines;
};

/** Cuts `text` to fit `width` pixels. */
const fit = (ctx: CanvasRenderingContext2D, text: string, width: number) => wrap(ctx, text, width, 1)[0] ?? "";

/** Draws a 1080×1920 story card of a settled group. Everything is drawn here, on the phone. */
export function drawSettledCard(canvas: HTMLCanvasElement, d: SettledCardData) {
	canvas.width = CARD_W;
	canvas.height = CARD_H;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	const { from, to, soft, font } = look();
	const PAD = 96;
	const inner = CARD_W - PAD * 2;

	const bg = ctx.createLinearGradient(0, 0, CARD_W * 0.4, CARD_H);
	bg.addColorStop(0, from);
	bg.addColorStop(1, to);
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, CARD_W, CARD_H);

	ctx.textBaseline = "alphabetic";
	ctx.fillStyle = "#ffffff";

	// Header: the stamp, the group, its numbers.
	ctx.font = `700 40px ${font}`;
	ctx.fillText("✓  ALL SETTLED", PAD, 210);
	ctx.font = `700 104px ${font}`;
	let y = 340;
	for (const line of wrap(ctx, d.groupName, inner, 2)) {
		ctx.fillText(line, PAD, y);
		y += 116;
	}
	ctx.fillStyle = soft;
	ctx.font = `500 44px ${font}`;
	const facts = [plural(d.people, "friend"), plural(d.count, "expense"), ...(d.days > 1 ? [plural(d.days, "day")] : [])];
	ctx.fillText(fit(ctx, facts.join(" · "), inner), PAD, y);
	if (d.amounts) ctx.fillText(fit(ctx, `${formatCurrency(d.total, d.currency)} shared`, inner), PAD, y + 62);

	// Their award, big.
	const mine = d.awards.find((a) => a.personId === d.forId);
	y += (d.amounts ? 62 : 0) + 180;
	if (mine) {
		ctx.fillStyle = "rgba(255,255,255,0.12)";
		ctx.beginPath();
		ctx.roundRect(PAD, y - 90, inner, 420, 48);
		ctx.fill();
		ctx.fillStyle = "#ffffff";
		ctx.font = `160px ${font}`;
		ctx.fillText(mine.emoji, PAD + 56, y + 110);
		ctx.font = `600 40px ${font}`;
		ctx.fillStyle = soft;
		ctx.fillText(fit(ctx, `${d.nameOf(d.forId)} is the`, inner - 112), PAD + 56, y + 200);
		ctx.fillStyle = "#ffffff";
		ctx.font = `700 76px ${font}`;
		ctx.fillText(fit(ctx, mine.title, inner - 112), PAD + 56, y + 280);
		y += 420;
	}

	// The rest of the table: one line each when two don't fit, and "+N more" past that.
	ctx.font = `600 36px ${font}`;
	ctx.fillStyle = soft;
	ctx.fillText("THE TABLE", PAD, y + 40);
	y += 80;
	const rest = d.awards.filter((a) => a !== mine);
	const space = CARD_H - 220 - y;
	const full = rest.length * 118 <= space;
	const rowH = full ? 118 : 72;
	const fits = Math.floor(space / rowH);
	const shown = rest.length > fits ? rest.slice(0, fits - 1) : rest;
	for (const a of shown) {
		ctx.fillStyle = "#ffffff";
		ctx.font = `${full ? 56 : 44}px ${font}`;
		ctx.fillText(a.emoji, PAD, y + 56);
		ctx.font = `600 44px ${font}`;
		const name = fit(ctx, d.nameOf(a.personId), 360);
		ctx.textAlign = "right";
		ctx.fillText(name, CARD_W - PAD, y + 52);
		ctx.textAlign = "left";
		ctx.fillText(fit(ctx, a.title, inner - 120 - ctx.measureText(name).width - 32), PAD + 96, y + 52);
		if (full) {
			ctx.fillStyle = soft;
			ctx.font = `400 34px ${font}`;
			ctx.fillText(fit(ctx, awardDetail(a, d.currency, d.amounts), inner - 96), PAD + 96, y + 98);
		}
		y += rowH;
	}
	if (shown.length < rest.length) {
		ctx.fillStyle = soft;
		ctx.font = `500 40px ${font}`;
		ctx.fillText(`+ ${rest.length - shown.length} more`, PAD + 96, y + 52);
	}

	// Footer.
	ctx.fillStyle = "#ffffff";
	ctx.font = `700 48px ${font}`;
	ctx.fillText("SplitBiller", PAD, CARD_H - 150);
	ctx.fillStyle = soft;
	ctx.font = `400 36px ${font}`;
	ctx.fillText("Split with friends. No signup. splitbiller.com", PAD, CARD_H - 96);
}
