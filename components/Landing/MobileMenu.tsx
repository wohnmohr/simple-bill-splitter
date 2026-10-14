"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { MENU_EXTRA_LINKS, NAV_LINKS, type NavPage } from "@/content/nav";

/** The phone-width menu behind a hamburger; the bar shows the same links from tablet width up. */
export const MobileMenu = ({ current }: { current?: NavPage }) => {
	const [open, setOpen] = useState(false);
	const panelId = useId();
	const root = useRef<HTMLDivElement>(null);
	const pathname = usePathname();

	// Close on navigation, Escape, or a tap outside.
	useEffect(() => setOpen(false), [pathname]);
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		const onPointer = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
		document.addEventListener("keydown", onKey);
		document.addEventListener("pointerdown", onPointer);
		return () => {
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("pointerdown", onPointer);
		};
	}, [open]);

	return (
		<div ref={root} className="sm:hidden">
			<button
				type="button"
				className="icon-btn"
				aria-expanded={open}
				aria-controls={panelId}
				aria-label={open ? "Close menu" : "Open menu"}
				onClick={() => setOpen((o) => !o)}
			>
				{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
			</button>
			{open && (
				<div id={panelId} className="absolute inset-x-0 top-full border-b border-line bg-paper px-4 pb-4 pt-2 shadow-raised">
					<ul className="divide-y divide-line">
						{[...NAV_LINKS, ...MENU_EXTRA_LINKS].map(({ href, label, page }) => {
							const here = !!page && page === current;
							return (
								<li key={href}>
									<Link
										href={href}
										onClick={() => setOpen(false)}
										aria-current={here ? "page" : undefined}
										className="block py-3 text-base font-medium text-ink aria-[current=page]:text-brand-700"
									>
										{label}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</div>
	);
};
