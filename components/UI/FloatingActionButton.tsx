"use client";

import { Plus } from "lucide-react";

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
	return (
		<div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none pb-[max(1rem,env(safe-area-inset-bottom))]">
			<div className="mx-auto flex max-w-2xl justify-end px-4 lg:max-w-5xl lg:px-6">
				<button
					onClick={onClick}
					className={`pointer-events-auto inline-flex h-14 items-center gap-2 rounded-full bg-brand-700 pl-5 pr-6 text-base font-semibold text-white shadow-raised transition-[background-color,transform] hover:bg-brand-800 active:scale-[0.97] ${
						showTooltip ? "ring-4 ring-brand-200" : ""
					}`}
				>
					<Plus className="h-5 w-5" strokeWidth={2.5} />
					{label}
				</button>
			</div>
		</div>
	);
};
