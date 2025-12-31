interface HeaderProps {}

export const Header = ({}: HeaderProps) => {
	return (
		<div className="mb-3 sm:mb-4">
			<h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
				Bill Splitter
			</h1>
		</div>
	);
};
