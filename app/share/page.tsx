import type { Metadata } from "next";
import Link from "next/link";
import { ShareViewer } from "@/components/Share/ShareViewer";

export const metadata: Metadata = {
	title: "Shared Settlement | SplitBiller",
	description:
		"View a privately shared bill split. Decrypted only in your browser — SplitBiller never stores the expenses.",
	robots: {
		index: false,
		follow: false,
	},
};

export default function SharePage() {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink safe-pb">
			<header className="border-b border-line px-4">
				<div className="max-w-2xl mx-auto flex h-14 items-center gap-2.5 min-w-0">
					<Link href="/" className="flex items-center gap-2.5 group min-w-0">
						<img
							src="/logo.png"
							alt=""
							className="h-8 w-8 object-contain scale-[1.6] shrink-0"
						/>
						<span className="font-display text-lg font-semibold text-ink truncate">
							SplitBiller
						</span>
					</Link>
				</div>
			</header>
			<div className="px-4 py-5 sm:py-8 max-w-2xl mx-auto w-full min-w-0">
				<ShareViewer />
			</div>
		</main>
	);
}
