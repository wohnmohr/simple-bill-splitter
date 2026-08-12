import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { MantineProvider } from "@/components/providers/MantineProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import "@mantine/core/styles.css";
import "./globals.css";

const outfit = Outfit({
	subsets: ["latin"],
	variable: "--font-outfit",
	display: "swap",
});

const fraunces = Fraunces({
	subsets: ["latin"],
	variable: "--font-fraunces",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_SITE_URL || "https://splitbiller.com"
	),
	title: "SplitBiller — Split Bills in ₹ | No Login, UPI Ready",
	description:
		"Split group expenses in rupees instantly. Calculate who owes whom, share a private settlement link, and pay via UPI — no signup, no app download.",
	keywords: [
		"bill splitter",
		"upi bill splitter",
		"expense splitter india",
		"split bills",
		"splitwise alternative",
		"no login bill splitter",
		"split restaurant bills",
		"roommate expense splitter",
		"who owes whom",
		"privacy-first bill splitter",
	],
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{
				url: "/web-app-manifest-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				url: "/web-app-manifest-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
		apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
	},
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "SplitBiller",
	},
	openGraph: {
		title: "SplitBiller — Split Bills in ₹ | No Login, UPI Ready",
		description:
			"Split expenses in rupees, share privately, pay via UPI. No signup required.",
		type: "website",
		url: "/",
		siteName: "SplitBiller",
	},
	twitter: {
		card: "summary_large_image",
		title: "SplitBiller — Split Bills in ₹ | No Login, UPI Ready",
		description:
			"Split expenses in rupees, share privately, pay via UPI. No signup required.",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en-IN">
			<body className={`${outfit.variable} ${fraunces.variable} font-sans antialiased`}>
				<PostHogProvider>
					<MantineProvider>
						{children}
						<Analytics />
					</MantineProvider>
				</PostHogProvider>
			</body>
		</html>
	);
}
