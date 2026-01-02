import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { MantineProvider } from "@/components/providers/MantineProvider";
import "@mantine/core/styles.css";
import "./globals.css";

const poppins = Poppins({
	weight: ["300", "400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-poppins",
});

export const metadata: Metadata = {
	title: "SplitBiller — Split Expenses Instantly | No Login, No App",
	description:
		"Split group expenses online in seconds. Calculate who owes whom without signing up, downloading an app, or sharing personal data. Perfect for restaurants, trips, roommates, and office lunches. Privacy-first expense splitter.",
	keywords: [
		"bill splitter",
		"expense splitter",
		"split bills",
		"split expenses",
		"splitwise alternative",
		"no login bill splitter",
		"free expense calculator",
		"split restaurant bills",
		"split trip expenses",
		"roommate expense splitter",
		"group expense calculator",
		"who owes whom",
		"bill splitting calculator",
		"expense sharing",
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
		title: "SplitBiller — Split Expenses Instantly | No Login, No App",
		description:
			"Split group expenses online in seconds. No signup, no app, no data stored. Perfect for restaurants, trips, and roommates.",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "SplitBiller — Split Expenses Instantly | No Login, No App",
		description:
			"Split group expenses online in seconds. No signup, no app, no data stored.",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={poppins.className}>
				<MantineProvider>
					<Script
						async
						src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1932835805964012"
						crossOrigin="anonymous"
						strategy="afterInteractive"
					/>
					{children}
					<Analytics />
				</MantineProvider>
			</body>
		</html>
	);
}
