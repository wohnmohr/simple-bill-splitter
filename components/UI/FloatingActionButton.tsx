"use client";

import { useState, useEffect } from "react";

interface FloatingActionButtonProps {
	onClick: () => void;
	label?: string;
	showTooltip?: boolean;
}

export const FloatingActionButton = ({
	onClick,
	label = "Add expense",
	showTooltip = false,
}: FloatingActionButtonProps) => {
	const [isTooltipVisible, setIsTooltipVisible] = useState(false);

	useEffect(() => {
		if (showTooltip) {
			// Delay the tooltip appearance slightly after page load
			const timer = setTimeout(() => {
				setIsTooltipVisible(true);
			}, 500);
			return () => clearTimeout(timer);
		} else {
			setIsTooltipVisible(false);
		}
	}, [showTooltip]);

	return (
		<div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
			{isTooltipVisible && (
				<div className="absolute bottom-full right-0 mb-3 sm:mb-4 animate-fade-in-up">
					<div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg shadow-xl whitespace-nowrap relative">
						Add expenses here
						{/* Tooltip arrow */}
						<div className="absolute top-full right-4 sm:right-5 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-indigo-600"></div>
					</div>
				</div>
			)}
			<button
				onClick={onClick}
				className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center text-xl sm:text-2xl font-bold transition-all hover:scale-110 active:scale-95 touch-manipulation"
				aria-label={label}
			>
				+
			</button>
		</div>
	);
};
