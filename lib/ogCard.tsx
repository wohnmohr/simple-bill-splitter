/**
 * Link preview cards (Open Graph images) in SplitBiller's own look: the paper
 * background, Fraunces headlines, Outfit text and the aubergine palette from
 * app/globals.css. Rendered at build time by the opengraph-image routes.
 *
 * WhatsApp and others crop previews towards the middle, so the headline sits
 * in the left column and nothing that matters touches the edges.
 */
import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";
import type { ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

/** Aubergine, the default theme (utils/themes.ts). */
export const C = {
	paper: "#f7f6f3",
	surface: "#ffffff",
	ink: "#1c1826",
	inkSoft: "#4a4556",
	inkMuted: "#6b6576",
	line: "#e7e3ea",
	brand50: "#f6f2fa",
	brand100: "#ece3f5",
	brand700: "#53307b",
	brand800: "#432763",
	positive: "#11754c",
	positiveSoft: "#e8f4ee",
};

const asset = (path: string) => readFile(join(process.cwd(), path));

type Props = {
	/** One or two short lines, in Fraunces. */
	title: string;
	sub: string;
	/** The right-hand picture: a slice of the app. */
	visual: ReactNode;
};

export async function ogCard({ title, sub, visual }: Props) {
	const [fraunces, outfitMedium, outfitSemi, mark] = await Promise.all([
		asset("assets/fonts/Fraunces-SemiBold.ttf"),
		asset("assets/fonts/Outfit-Medium.ttf"),
		asset("assets/fonts/Outfit-SemiBold.ttf"),
		asset("public/web-app-manifest-512x512.png"),
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
					backgroundImage: `radial-gradient(circle at 86% 14%, ${C.brand100} 0%, ${C.paper} 48%)`,
					// Outfit has no ₹, so rupee amounts fall back to Fraunces (as the app's display amounts are).
					fontFamily: "Outfit, Fraunces",
					color: C.ink,
				}}
			>
				<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
					<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
						{/* The mark sits on a white tile, like the app icon. */}
						<div style={{ display: "flex", padding: 6, borderRadius: 18, background: C.surface, border: `2px solid ${C.line}` }}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={`data:image/png;base64,${mark.toString("base64")}`} width={52} height={52} alt="" />
						</div>
						<span style={{ fontFamily: "Fraunces", fontSize: 36 }}>SplitBiller</span>
					</div>
					<div style={{ display: "flex", marginTop: 40, fontFamily: "Fraunces", fontSize: 68, lineHeight: 1.06, letterSpacing: "-1px" }}>
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
				{ name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
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
			borderRadius: 28,
			padding: 32,
			boxShadow: "0 24px 48px -16px rgba(67,39,99,0.28)",
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
			borderRadius: 16,
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
