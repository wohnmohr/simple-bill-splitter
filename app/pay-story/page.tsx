import type { Metadata } from "next";
import Link from "next/link";
import { PayStoryApp } from "@/components/PayStory/PayStoryApp";

export const metadata: Metadata = {
	title: "Share a Split via UPI | SplitBiller",
	description:
		"Create a shareable bill split for dinners, rent, trips and gifts. Friends pay you via UPI and you track who has paid. No signup; the split lives in the link.",
	alternates: { canonical: "/pay-story" },
};

export default function PayStoryPage() {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink safe-pb">
			<header className="border-b border-line px-4">
				<div className="mx-auto flex h-14 max-w-xl items-center">
					<Link href="/" className="flex items-center gap-2.5 min-w-0">
						<img src="/logo-mark.webp" alt="" width={35} height={30} className="h-[30px] w-[35px] shrink-0 object-contain" />
						<span className="truncate font-display text-lg font-semibold">SplitBiller</span>
					</Link>
				</div>
			</header>
			<div className="mx-auto w-full max-w-xl min-w-0 px-4 py-5 sm:py-8">
				<PayStoryApp />
			</div>
		</main>
	);
}
