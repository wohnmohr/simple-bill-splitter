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
export const ScanOrderButton = ({ state, onFile, label = "Scan a food order screenshot", className = "" }: Props) => {
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
				{reading ? `Scanning… ${Math.round(state.progress * 100)}%` : label}
				{!reading && (
					<span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-brand-700">
						Beta
					</span>
				)}
			</button>
			{reading ? (
				<>
					<div
						className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-50"
						role="progressbar"
						aria-label="Scanning"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={Math.round(state.progress * 100)}
					>
						<div className="h-full rounded-full bg-brand-700 transition-[width] duration-200" style={{ width: `${Math.max(2, state.progress * 100)}%` }} />
					</div>
					{/* What it's doing right now, in words (read out by screen readers too). */}
					<p className="mt-2 text-xs tabular-nums text-ink-soft" aria-live="polite">
						{state.step}
					</p>
				</>
			) : state.status === "error" ? (
				<p role="alert" className="mt-2 text-sm text-negative">
					{state.message}
				</p>
			) : (
				<p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
					<ShieldCheck className="h-3.5 w-3.5 shrink-0 text-positive" />
					Read on your device and never uploaded. In beta: check the amounts before saving.
				</p>
			)}
		</div>
	);
};
