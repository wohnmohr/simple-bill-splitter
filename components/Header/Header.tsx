import Link from "next/link";
import { LayoutGrid, MessageSquare, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/UI/LogoMark";
import { ColorModeToggle } from "@/components/UI/ColorModeToggle";

export const Header = ({ onFeedback }: { onFeedback?: () => void }) => {
	return (
		<header className="mb-5 sm:mb-6 flex h-12 items-center justify-between gap-3">
			<Link
				href="/"
				className="flex items-center min-w-0 rounded-xl -ml-1 px-1 py-2"
			>
				<LogoMark />
			</Link>
			<div className="flex shrink-0 items-center gap-1">
				<ColorModeToggle />
				{onFeedback && (
					<button type="button" onClick={onFeedback} className="btn-ghost" aria-label="Feedback">
						<MessageSquare className="h-4 w-4" />
						<span className="hidden sm:inline">Feedback</span>
					</button>
				)}
				<Link href="/features" className="btn-ghost" aria-label="Features">
					<Sparkles className="h-4 w-4" />
					<span className="hidden sm:inline">Features</span>
				</Link>
				<Link href="/tools" className="btn-ghost" aria-label="Tools">
					<LayoutGrid className="h-4 w-4" />
					<span className="hidden sm:inline">Tools</span>
				</Link>
			</div>
		</header>
	);
};
