"use client";

import { useState, useEffect } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";

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
			const timer = setTimeout(() => {
				setIsTooltipVisible(true);
			}, 500);
			return () => clearTimeout(timer);
		} else {
			setIsTooltipVisible(false);
		}
	}, [showTooltip]);

	return (
		<div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 mb-[env(safe-area-inset-bottom)]">
			<Tooltip
				label="Add expenses here"
				opened={isTooltipVisible}
				position="top"
				withArrow
				zIndex={100}
			>
				<ActionIcon
					onClick={onClick}
					size={56}
					radius="xl"
					variant="filled"
					aria-label={label}
					style={{
						background: "linear-gradient(to right, #4f46e5, #9333ea)",
						transition: "all 0.2s",
					}}
					className="hover:opacity-90 active:opacity-80 hover:scale-110 active:scale-95 shadow-2xl"
				>
					<span className="text-2xl font-bold">+</span>
				</ActionIcon>
			</Tooltip>
		</div>
	);
};
