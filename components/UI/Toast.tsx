"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export type ToastState = {
	id: number;
	message: string;
	actionLabel?: string;
	onAction?: () => void;
} | null;

interface ToastProps {
	toast: ToastState;
	onDismiss: () => void;
	/** Lift above the floating "Add expense" button when it is showing. */
	raised?: boolean;
}

const DURATION_MS = 6000;

export const Toast = ({ toast, onDismiss, raised = false }: ToastProps) => {
	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(onDismiss, DURATION_MS);
		return () => clearTimeout(timer);
	}, [toast, onDismiss]);

	return (
		<div
			className={`pointer-events-none fixed inset-x-0 z-[400] flex justify-center px-4 transition-[bottom] ${
				raised
					? "bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.5rem)]"
					: "bottom-[max(1rem,env(safe-area-inset-bottom))]"
			}`}
			aria-live="polite"
			role="status"
		>
			{toast && (
				<div
					key={toast.id}
					className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-ink py-2.5 pl-4 pr-2 text-sm text-white shadow-raised animate-[fade-in-up_0.2s_ease-out]"
				>
					<span className="min-w-0 flex-1">{toast.message}</span>
					{toast.actionLabel && toast.onAction && (
						<button
							type="button"
							onClick={() => {
								toast.onAction?.();
								onDismiss();
							}}
							className="shrink-0 rounded-lg px-3 py-1.5 font-semibold text-brand-200 hover:bg-white/10"
						>
							{toast.actionLabel}
						</button>
					)}
					<button
						type="button"
						onClick={onDismiss}
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
						aria-label="Dismiss"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			)}
		</div>
	);
};
