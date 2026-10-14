"use client";

import { useRef } from "react";
import { Loader2, ScanLine, ShieldCheck } from "lucide-react";
import type { ScanState } from "@/components/Scan/useOrderScan";

type Props = {
	state: ScanState;
	onFile: (file: File) => void;
	label?: string;
	className?: string;
};

/** Picks a screenshot (or a photo) and shows how reading it is going. */
export const ScanOrderButton = ({ state, onFile, label = "Scan a Swiggy or Zomato screenshot", className = "" }: Props) => {
	const input = useRef<HTMLInputElement>(null);
	const reading = state.status === "reading";
	return (
		<div className={className}>
			<input
				ref={input}
				type="file"
				accept="image/*"
				className="sr-only"
				tabIndex={-1}
				aria-hidden
				onChange={(e) => {
					const file = e.target.files?.[0];
					e.target.value = "";
					if (file) onFile(file);
				}}
			/>
			<button type="button" onClick={() => input.current?.click()} disabled={reading} className="btn-secondary w-full !justify-center">
				{reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
				{reading ? `Reading the order… ${Math.round(state.progress * 100)}%` : label}
			</button>
			{reading && (
				<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-50" aria-hidden>
					<div className="h-full rounded-full bg-brand-700 transition-[width] duration-300" style={{ width: `${Math.max(4, state.progress * 100)}%` }} />
				</div>
			)}
			{state.status === "error" ? (
				<p role="alert" className="mt-2 text-sm text-negative">
					{state.message}
				</p>
			) : (
				<p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
					<ShieldCheck className="h-3.5 w-3.5 shrink-0 text-positive" />
					Read on your device. The screenshot never leaves it.
				</p>
			)}
		</div>
	);
};
