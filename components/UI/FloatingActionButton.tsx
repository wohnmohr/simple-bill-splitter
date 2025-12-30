interface FloatingActionButtonProps {
	onClick: () => void;
	label?: string;
}

export const FloatingActionButton = ({
	onClick,
	label = "Add expense",
}: FloatingActionButtonProps) => {
	return (
		<button
			onClick={onClick}
			className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center text-xl sm:text-2xl font-bold z-40 transition-all hover:scale-110 active:scale-95 touch-manipulation"
			aria-label={label}
		>
			+
		</button>
	);
};
