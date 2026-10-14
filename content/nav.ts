export type NavPage = "features" | "tools" | "roadmap";

/** The marketing pages' top links: in the bar from tablet width up, behind the hamburger on phones. */
export const NAV_LINKS: { href: string; label: string; page?: NavPage }[] = [
	{ href: "/features", label: "Features", page: "features" },
	{ href: "/tools", label: "Tools", page: "tools" },
	{ href: "/roadmap", label: "Roadmap", page: "roadmap" },
	{ href: "/#faq", label: "FAQ" },
];

/** Extra links for the phone menu only. */
export const MENU_EXTRA_LINKS: { href: string; label: string; page?: NavPage }[] = [
	{ href: "/about", label: "About" },
	{ href: "/contact", label: "Contact" },
];
