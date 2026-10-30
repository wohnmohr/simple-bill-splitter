import type { Metadata, Viewport } from "next";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { VercelAnalytics } from "@/components/providers/VercelAnalytics";
import { FeedbackNudge } from "@/components/Feedback/FeedbackNudge";
import { InstallPromptCapture } from "@/components/providers/InstallPromptCapture";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Runs before paint so a saved light or dark choice never flashes the other theme.
// With no saved choice the CSS follows the OS (app/globals.css). Keep in sync with utils/colorMode.ts.
const colorModeScript = `try{var m=localStorage.getItem("splitbiller-color-mode");if(m==="light"||m==="dark")document.documentElement.dataset.theme=m}catch(e){}`;

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
		{ media: "(prefers-color-scheme: dark)", color: "#171317" },
	],
};

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
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
			{ url: "/favicon.svg", type: "image/svg+xml" },
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
		<html lang="en-IN" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: colorModeScript }} />
			</head>
			<body className="font-sans antialiased">
				<PostHogProvider>
					{children}
					<FeedbackNudge />
					<InstallPromptCapture />
					<VercelAnalytics />
				</PostHogProvider>
			</body>
		</html>
	);
}
