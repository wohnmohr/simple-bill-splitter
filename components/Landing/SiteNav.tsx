import Link from "next/link";
import { TrackedLink } from "@/components/UI/TrackedLink";
import { LogoMark } from "@/components/UI/LogoMark";

/** Top bar of the marketing pages (home, features). */
export const SiteNav = ({ current }: { current?: "features" }) => (
	<nav className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
		<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
			<Link href="/" className="flex items-center gap-2 shrink-0">
				<LogoMark />
				<span className="font-display text-lg font-semibold text-ink">SplitBiller</span>
			</Link>
			<div className="flex items-center gap-1 sm:gap-2">
				<Link
					href="/features"
					aria-current={current === "features" ? "page" : undefined}
					className="btn-ghost aria-[current=page]:text-brand-700"
				>
					Features
				</Link>
				<a href="/#tools" className="btn-ghost hidden sm:inline-flex">
					Calculators
				</a>
				<a href="/#faq" className="btn-ghost hidden sm:inline-flex">
					FAQ
				</a>
				<TrackedLink href="/dashboard" className="btn-primary !py-2" location={current ? `${current}_nav` : "nav"}>
					Open app
				</TrackedLink>
			</div>
		</div>
	</nav>
);
