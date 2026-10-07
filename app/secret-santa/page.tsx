import type { Metadata } from "next";
import Link from "next/link";
import { SecretSantaReveal } from "@/components/Tools/SecretSantaReveal";

export const metadata: Metadata = {
	title: "Your Secret Santa match | SplitBiller",
	description: "A private Secret Santa reveal link.",
	robots: { index: false, follow: false },
};

export default function SecretSantaPage() {
	return (
		<main className="page-shell min-h-screen bg-paper text-ink safe-pb">
			<header className="border-b border-line px-4">
				<div className="mx-auto flex h-14 max-w-2xl items-center">
					<Link href="/" className="flex min-w-0 items-center gap-2.5">
						<img src="/logo-mark.webp" alt="" width={35} height={30} className="h-[30px] w-[35px] shrink-0 object-contain" />
						<span className="truncate font-display text-lg font-semibold text-ink">SplitBiller</span>
					</Link>
				</div>
			</header>
			<div className="mx-auto w-full max-w-2xl min-w-0 px-4">
				<SecretSantaReveal />
			</div>
		</main>
	);
}
