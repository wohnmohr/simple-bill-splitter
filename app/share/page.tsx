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
		<main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-900">
			<header className="px-4 pt-6 pb-2">
				<div className="max-w-2xl mx-auto flex items-center gap-2">
					<Link href="/" className="flex items-center gap-2 group">
						<img
							src="/logo.png"
							alt="SplitBiller"
							className="w-10 h-10 object-contain"
						/>
						<span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:opacity-80">
							SplitBiller
						</span>
					</Link>
				</div>
			</header>
			<div className="px-4 py-6 sm:py-8">
				<ShareViewer />
			</div>
		</main>
	);
}
