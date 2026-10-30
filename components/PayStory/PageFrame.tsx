import Link from "next/link";
import { FeedbackButton } from "@/components/Feedback/FeedbackButton";
import { LogoMark } from "@/components/UI/LogoMark";

/** Shared page chrome for the /split pages and the shared-link view. */
export const PageFrame = ({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) => (
	<main className="page-shell min-h-screen bg-paper text-ink safe-pb">
		<header className="border-b border-line bg-surface px-4">
			<div className={`mx-auto flex h-14 items-center justify-between ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
				<Link href="/" className="flex min-w-0 items-center gap-2.5">
					<LogoMark />
				</Link>
				<div className="flex shrink-0 items-center gap-1">
					<FeedbackButton />
					<Link href="/split" className="btn-ghost">All splits</Link>
				</div>
			</div>
		</header>
		{children}
	</main>
);
