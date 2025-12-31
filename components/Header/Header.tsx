interface HeaderProps {}

export const Header = ({}: HeaderProps) => {
	return (
		<div className="mb-3 sm:mb-4 flex items-center gap-2">
			<img
				src="/logo.png"
				alt="SplitBiller Logo"
				className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover"
			/>
			<h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-none">
				SplitBiller
			</h1>
		</div>
	);
};
