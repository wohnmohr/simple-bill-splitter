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
		<main className="page-shell min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 text-gray-900 safe-pb">
			<header className="px-4 pt-4 pb-2">
				<div className="max-w-lg sm:max-w-2xl mx-auto flex items-center gap-2.5 min-w-0">
					<Link href="/" className="flex items-center gap-2.5 group min-w-0">
						<img
							src="/logo.png"
							alt="SplitBiller"
							className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-100 shrink-0"
						/>
						<span className="font-bold text-base bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent truncate">
							SplitBiller
						</span>
					</Link>
				</div>
			</header>
			<div className="px-4 py-5 sm:py-8 max-w-lg sm:max-w-2xl mx-auto w-full min-w-0">
				<ShareViewer />
			</div>
		</main>
	);
}
