/**
 * Link preview cards (Open Graph images) in SplitBiller's own look (design system v1):
 * warm paper, the outlined logo, DejaVu Sans Bold headlines and amounts (the logo's
 * own letterforms, and it has ₹), Outfit text. Rendered at build time by the
 * opengraph-image routes.
 *
 * WhatsApp and others crop previews towards the middle, so the headline sits
 * in the left column and nothing that matters touches the edges.
 */
import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";
import type { ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

/** The light tokens from app/globals.css. */
export const C = {
	paper: "#faf7f2",
	surface: "#ffffff",
	ink: "#282326",
	inkSoft: "#4f454a",
	inkMuted: "#71656b",
	line: "#ded3d9",
	brand50: "#faf4f7",
	brand100: "#f2ecef",
	brand700: "#713f57",
	brand800: "#5d3046",
	positive: "#286344",
	positiveSoft: "#e5f1e7",
};

/** Headline and amount face; Outfit has no ₹. */
export const DISPLAY = "DejaVu Sans";

const asset = (path: string) => readFile(join(process.cwd(), path));

type Props = {
	/** One or two short lines, in the display face. */
	title: string;
	sub: string;
	/** The right-hand picture: a slice of the app. */
	visual: ReactNode;
};

export async function ogCard({ title, sub, visual }: Props) {
	const [display, outfitMedium, outfitSemi, logo] = await Promise.all([
		asset("assets/fonts/DejaVuSans-Bold.ttf"),
		asset("assets/fonts/Outfit-Medium.ttf"),
		asset("assets/fonts/Outfit-SemiBold.ttf"),
		asset("assets/brand/logo-horizontal-light.svg"),
	]);

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					gap: 56,
					padding: "0 72px",
					background: C.paper,
					// Outfit has no ₹, so amounts fall back to the display face.
					fontFamily: `Outfit, ${DISPLAY}`,
					color: C.ink,
				}}
			>
				<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
					{/* The supplied lockup; its wordmark is outlined, so it needs no font. */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={`data:image/svg+xml;base64,${logo.toString("base64")}`} width={260} height={50} alt="" />
					<div style={{ display: "flex", marginTop: 40, fontFamily: DISPLAY, fontSize: 64, lineHeight: 1.08, letterSpacing: "-1px" }}>
						{title}
					</div>
					<div style={{ display: "flex", marginTop: 22, fontSize: 30, lineHeight: 1.35, color: C.inkSoft }}>{sub}</div>
				</div>
				<div style={{ display: "flex", width: 430 }}>{visual}</div>
			</div>
		),
		{
			...OG_SIZE,
			fonts: [
				{ name: DISPLAY, data: display, weight: 700, style: "normal" },
				{ name: "Outfit", data: outfitMedium, weight: 500, style: "normal" },
				{ name: "Outfit", data: outfitSemi, weight: 600, style: "normal" },
			],
		}
	);
}

// ── Pieces of the app, drawn for the cards ─────────────────────

/** A white card, as `.surface` draws it in the app. */
export const Surface = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
	<div
		style={{
			display: "flex",
			flexDirection: "column",
			width: "100%",
			background: C.surface,
			border: `2px solid ${C.line}`,
			borderRadius: 24,
			padding: 32,
			...style,
		}}
	>
		{children}
	</div>
);

export const PayButton = ({ children }: { children: ReactNode }) => (
	<div
		style={{
			display: "flex",
			justifyContent: "center",
			gap: 9,
			marginTop: 22,
			padding: "18px 0",
			borderRadius: 12,
			background: C.brand700,
			color: "#ffffff",
			fontSize: 26,
			fontWeight: 600,
		}}
	>
		{children}
	</div>
);

export const Avatar = ({ letter, shade }: { letter: string; shade: string }) => (
	<div
		style={{
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			width: 52,
			height: 52,
			marginLeft: -10,
			borderRadius: 999,
			border: `4px solid ${C.surface}`,
			background: shade,
			color: "#ffffff",
			fontSize: 22,
			fontWeight: 600,
		}}
	>
		{letter}
	</div>
);
