import Link from "next/link";

export const Header = () => {
	return (
		<header className="mb-4 sm:mb-5 flex items-center justify-between gap-3">
			<Link href="/" className="flex items-center gap-2.5 min-w-0 group">
				<img
					src="/logo.png"
					alt="SplitBiller"
					className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shrink-0 ring-2 ring-indigo-100 group-hover:ring-indigo-200 transition-all"
				/>
				<div className="min-w-0">
					<h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-tight">
						SplitBiller
					</h1>
					<p className="text-[11px] sm:text-xs text-gray-500 leading-none mt-0.5">
						Split & settle in ₹
					</p>
				</div>
			</Link>
			<Link
				href="/#tools"
				className="shrink-0 text-xs sm:text-sm font-medium text-indigo-700 hover:text-indigo-900 px-2 py-1.5"
			>
				Tools
			</Link>
		</header>
	);
};
