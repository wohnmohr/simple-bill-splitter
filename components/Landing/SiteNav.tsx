import Link from "next/link";
import { TrackedLink } from "@/components/UI/TrackedLink";
import { LogoMark } from "@/components/UI/LogoMark";
import { MobileMenu } from "@/components/Landing/MobileMenu";
import { NAV_LINKS, type NavPage } from "@/content/nav";

/** Top bar of the marketing pages (home, features, tools, roadmap, about, contact). */
export const SiteNav = ({ current }: { current?: NavPage }) => (
	<nav aria-label="Main" className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
		<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
			<Link href="/" className="flex items-center gap-2 shrink-0">
				<LogoMark />
				<span className="font-display text-lg font-semibold text-ink">SplitBiller</span>
			</Link>
			<div className="flex items-center gap-1 sm:gap-2">
				{NAV_LINKS.map(({ href, label, page }) => (
					<Link
						key={href}
						href={href}
						aria-current={page && current === page ? "page" : undefined}
						className="btn-ghost hidden sm:inline-flex aria-[current=page]:text-brand-700"
					>
						{label}
					</Link>
				))}
				<TrackedLink href="/dashboard" className="btn-primary whitespace-nowrap !py-2" location={current ? `${current}_nav` : "nav"}>
					Open app
				</TrackedLink>
				<MobileMenu current={current} />
			</div>
		</div>
	</nav>
);
