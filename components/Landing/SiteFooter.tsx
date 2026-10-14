import Link from "next/link";
import { LogoMark } from "@/components/UI/LogoMark";

const PH_ICON =
	"https://ph-files.imgix.net/e82f50fe-9e12-48be-b029-948fa71563cd.png?auto=compress,format&codec=mozjpeg&cs=strip&fit=crop&h=32&w=32";

const LINKS: [string, string][] = [
	["/dashboard", "Open the app"],
	["/features", "Features"],
	["/tools", "Tools"],
	["/split", "Split links"],
	["/roadmap", "Roadmap"],
	["/about", "About"],
	["/contact", "Contact"],
];

/** Footer of the marketing pages (home, features, tools, roadmap, about, contact). */
export const SiteFooter = () => (
	<footer className="border-t border-line px-4 sm:px-6 py-10">
		<div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
			<div>
				<Link href="/" className="flex items-center gap-2">
					<LogoMark />
					<span className="font-display text-lg font-semibold text-ink">SplitBiller</span>
				</Link>
				<p className="mt-3 max-w-xs text-sm text-ink-muted">Split bills in ₹ and settle with UPI. No signup, no app download.</p>
				<a
					href="https://www.producthunt.com/products/split-biller?utm_source=badge&utm_medium=embed"
					target="_blank"
					rel="noopener noreferrer"
					className="btn-secondary mt-4 !py-2"
				>
					<img src={PH_ICON} alt="" width={16} height={16} loading="lazy" decoding="async" className="h-4 w-4 rounded" />
					Find us on Product Hunt
				</a>
			</div>
			<nav aria-label="Footer">
				<ul className="grid grid-cols-2 gap-x-10 gap-y-1 sm:grid-cols-3 md:grid-cols-1">
					{LINKS.map(([href, label]) => (
						<li key={href}>
							<Link href={href} className="block py-1.5 text-sm text-ink-soft hover:text-brand-700 hover:underline">
								{label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</div>
		<div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-line pt-6 text-sm text-ink-muted sm:flex-row sm:justify-between">
			<p>© {new Date().getFullYear()} splitbiller.com. All rights reserved.</p>
			<p>
				Created by{" "}
				<a
					href="https://www.wohnmohr.com"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-block py-1.5 font-medium text-ink-soft underline hover:text-brand-700"
				>
					wohnmohr
				</a>
			</p>
		</div>
	</footer>
);
