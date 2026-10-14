import Link from "next/link";
import { TrackedLink } from "@/components/UI/TrackedLink";
import { LogoMark } from "@/components/UI/LogoMark";

/** Top bar of the marketing pages (home, features, tools). */
export const SiteNav = ({ current }: { current?: "features" | "tools" }) => (
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
					className="btn-ghost hidden sm:inline-flex aria-[current=page]:text-brand-700"
				>
					Features
				</Link>
				<Link
					href="/tools"
					aria-current={current === "tools" ? "page" : undefined}
					className="btn-ghost aria-[current=page]:text-brand-700"
				>
					Tools
				</Link>
				<a href="/#faq" className="btn-ghost hidden sm:inline-flex">
					FAQ
				</a>
				<TrackedLink href="/dashboard" className="btn-primary whitespace-nowrap !py-2" location={current ? `${current}_nav` : "nav"}>
					Open app
				</TrackedLink>
			</div>
		</div>
	</nav>
);
