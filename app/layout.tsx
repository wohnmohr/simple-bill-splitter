import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
	weight: ["300", "400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-poppins",
});

export const metadata: Metadata = {
	title: "Split Expenses Instantly — No Login, No App | Free Bill Splitter",
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
	openGraph: {
		title: "Split Expenses Instantly — No Login, No App",
		description:
			"Split group expenses online in seconds. No signup, no app, no data stored. Perfect for restaurants, trips, and roommates.",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Split Expenses Instantly — No Login, No App",
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
			<body className={poppins.className}>{children}</body>
		</html>
	);
}
