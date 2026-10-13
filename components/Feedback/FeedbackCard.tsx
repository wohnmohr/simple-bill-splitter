"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";

type Props = { onClose: () => void; closeLabel: string; children: ReactNode } & Omit<HTMLAttributes<HTMLElement>, "className">;

/** The small floating card feedback opens in. It never blocks the page. */
export const FeedbackCard = ({ onClose, closeLabel, children, ...rest }: Props) => (
	<section
		aria-label="Feedback"
		data-feedback-inline
		{...rest}
		className="surface shadow-raised fixed inset-x-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+8.5rem)] z-[300] max-h-[70vh] overflow-y-auto p-4 animate-[fade-in-up_0.25s_ease-out] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-80"
	>
		<button type="button" onClick={onClose} className="icon-btn absolute right-1.5 top-1.5" aria-label={closeLabel}>
			<X className="h-4 w-4" />
		</button>
		<div className="pr-7">{children}</div>
	</section>
);
