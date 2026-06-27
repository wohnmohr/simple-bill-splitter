import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

export const alt = "SplitBiller — Split Expenses Instantly, No Login, No App";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
	const logoData = await readFile(join(process.cwd(), "public/logo.png"));
	const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundImage:
						"linear-gradient(135deg, #eef2ff 0%, #faf5ff 50%, #fdf2f8 100%)",
					fontFamily: "sans-serif",
					padding: "64px",
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={logoSrc} alt="SplitBiller" width={160} height={160} />
				<div
					style={{
						display: "flex",
						fontSize: 96,
						fontWeight: 800,
						color: "#4f46e5",
						marginTop: 8,
						letterSpacing: "-2px",
					}}
				>
					SplitBiller
				</div>
				<div
					style={{
						display: "flex",
						fontSize: 44,
						fontWeight: 700,
						color: "#1f2937",
						marginTop: 8,
						textAlign: "center",
					}}
				>
					Split Expenses Instantly
				</div>
				<div
					style={{
						display: "flex",
						gap: 16,
						marginTop: 40,
					}}
				>
					{["Free forever", "No sign-up", "Works on any device"].map((t) => (
						<div
							key={t}
							style={{
								display: "flex",
								fontSize: 30,
								fontWeight: 600,
								color: "#4f46e5",
								background: "#ffffff",
								border: "2px solid #c7d2fe",
								borderRadius: 9999,
								padding: "12px 28px",
							}}
						>
							{t}
						</div>
					))}
				</div>
			</div>
		),
		{ ...size }
	);
}
