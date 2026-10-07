import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FeatureRequestForm } from "@/components/Feedback/FeatureRequestForm";

export const metadata: Metadata = {
	title: "Request a feature | SplitBiller",
	description:
		"Tell us what SplitBiller should do next. Leave your email and we'll follow up to understand your use case.",
	alternates: { canonical: "/feature-requests" },
};

export default function FeatureRequestsPage() {
	return (
		<main className="page-shell min-h-screen bg-paper safe-pb">
			<header className="border-b border-line px-4">
				<div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3">
					<Link href="/" className="flex items-center gap-2 min-w-0">
						<img src="/logo-mark.webp" alt="" width={35} height={30} className="h-[30px] w-[35px] shrink-0 object-contain" />
						<span className="font-display text-lg font-semibold text-ink">SplitBiller</span>
					</Link>
					<Link href="/dashboard" className="btn-ghost">
						<ChevronLeft className="h-4 w-4" />
						My groups
					</Link>
				</div>
			</header>

			<div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
				<h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
					Request a feature
				</h1>
				<p className="mt-3 max-w-xl text-lg text-ink-soft">
					SplitBiller is built around how groups in India actually split money. Tell us
					what&apos;s missing — we reply to people whose ideas we want to explore.
				</p>
				<div className="mt-8">
					<FeatureRequestForm />
				</div>
			</div>
		</main>
	);
}
