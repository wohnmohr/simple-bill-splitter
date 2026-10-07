import Link from "next/link";
import { LayoutGrid, MessageSquare } from "lucide-react";

export const Header = ({ onFeedback }: { onFeedback?: () => void }) => {
	return (
		<header className="mb-5 sm:mb-6 flex h-12 items-center justify-between gap-3">
			<Link
				href="/"
				className="flex items-center gap-2 min-w-0 rounded-lg -ml-1 pl-1 pr-2 py-1"
			>
				<img src="/logo-mark.webp" alt="" width={35} height={30} className="h-[30px] w-[35px] shrink-0 object-contain" />
				<span className="font-display text-lg font-semibold text-ink leading-none">
					SplitBiller
				</span>
			</Link>
			<div className="flex shrink-0 items-center gap-1">
				{onFeedback && (
					<button type="button" onClick={onFeedback} className="btn-ghost">
						<MessageSquare className="h-4 w-4" />
						Feedback
					</button>
				)}
				<Link href="/#tools" className="btn-ghost" aria-label="Calculators">
					<LayoutGrid className="h-4 w-4" />
					<span className="hidden sm:inline">Calculators</span>
				</Link>
			</div>
		</header>
	);
};
