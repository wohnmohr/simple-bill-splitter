import Link from "next/link";

/** Shared page chrome for the /split pages and the shared-link view. */
export const PageFrame = ({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) => (
	<main className="page-shell min-h-screen bg-paper text-ink safe-pb">
		<header className="border-b border-line bg-white px-4">
			<div className={`mx-auto flex h-14 items-center justify-between ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
				<Link href="/" className="flex min-w-0 items-center gap-2.5">
					<img src="/logo-mark.webp" alt="" width={35} height={30} className="h-[30px] w-[35px] shrink-0 object-contain" />
					<span className="truncate font-display text-lg font-semibold">SplitBiller</span>
				</Link>
				<Link href="/split" className="btn-ghost">All splits</Link>
			</div>
		</header>
		{children}
	</main>
);
