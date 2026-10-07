"use client";

import { useMemo, useState } from "react";
import { RotateCw } from "lucide-react";
import { fieldClass, labelClass, parseNames, randomInt, useEngaged, useTrackResult } from "./shared";

const TOOL = "random-name-picker";
const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#10b981", "#8b5cf6", "#f97316", "#3b82f6"];
const SPIN_MS = 4500;

const point = (deg: number, r: number) => {
	const rad = (deg * Math.PI) / 180;
	return `${(100 + r * Math.sin(rad)).toFixed(2)} ${(100 - r * Math.cos(rad)).toFixed(2)}`;
};

/** Spin-the-wheel picker. The winner is chosen with crypto randomness, then the wheel is animated to land on it. */
export const NamePickerWheel = () => {
	const [text, setText] = useState("Asha\nRohan\nMeera\nKabir\nIsha\nDev");
	const [removeWinner, setRemoveWinner] = useState(false);
	const [rotation, setRotation] = useState(0);
	const [spinning, setSpinning] = useState(false);
	const [winner, setWinner] = useState<string | null>(null);
	const [pending, setPending] = useState<string | null>(null);
	const [history, setHistory] = useState<string[]>([]);
	const engaged = useEngaged(TOOL);
	useTrackResult(TOOL, !!winner);

	const names = useMemo(() => parseNames(text).slice(0, 50), [text]);
	const n = names.length;
	const seg = 360 / Math.max(n, 1);

	const spin = () => {
		if (spinning || n < 2) return;
		engaged();
		const idx = randomInt(n);
		const jitter = (Math.random() - 0.5) * seg * 0.7;
		const target = (((-(idx + 0.5) * seg - jitter) % 360) + 360) % 360;
		const delta = (((target - rotation) % 360) + 360) % 360;
		setWinner(null);
		setPending(names[idx]);
		setSpinning(true);
		setRotation(rotation + 360 * 6 + delta);
	};

	const onSpinEnd = () => {
		if (!spinning || !pending) return;
		setSpinning(false);
		setWinner(pending);
		setHistory((h) => [pending, ...h].slice(0, 10));
		if (removeWinner) setText(names.filter((x) => x !== pending).join("\n"));
		setPending(null);
	};

	const fontSize = n > 30 ? 5 : n > 16 ? 7 : n > 8 ? 9 : 11;

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
			<div className="surface space-y-4 p-4 sm:p-5">
				<div>
					<label className={labelClass} htmlFor="wheel-names">
						Names <span className="font-normal text-ink-muted">(one per line, up to 50)</span>
					</label>
					<textarea
						id="wheel-names"
						className={fieldClass}
						rows={8}
						value={text}
						onChange={(e) => {
							engaged();
							setText(e.target.value);
						}}
						disabled={spinning}
					/>
				</div>
				<label className="flex items-center gap-2 text-sm text-gray-700">
					<input
						type="checkbox"
						checked={removeWinner}
						onChange={(e) => setRemoveWinner(e.target.checked)}
						className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
					/>
					Remove the winner after each spin
				</label>
				{n < 2 && <p className="text-sm text-gray-500">Add at least 2 names to spin.</p>}
				{history.length > 0 && (
					<div>
						<p className="label-text">Previous winners</p>
						<p className="text-sm text-gray-700">{history.join(" · ")}</p>
					</div>
				)}
			</div>

			<div className="surface shadow-raised flex flex-col items-center gap-4 p-4 sm:p-5">
				<div className="relative w-full max-w-sm">
					<div
						aria-hidden
						className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 -translate-y-1 border-x-[10px] border-t-[18px] border-x-transparent border-t-gray-900"
					/>
					<svg
						viewBox="0 0 200 200"
						role="img"
						aria-label="Name wheel"
						className="w-full"
						style={{
							transform: `rotate(${rotation}deg)`,
							transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)` : "none",
						}}
						onTransitionEnd={onSpinEnd}
					>
						{n === 0 ? (
							<circle cx="100" cy="100" r="96" fill="#e5e7eb" />
						) : n === 1 ? (
							<circle cx="100" cy="100" r="96" fill={COLORS[0]} />
						) : (
							names.map((name, i) => (
								<path
									key={name}
									d={`M100 100 L${point(i * seg, 96)} A96 96 0 0 1 ${point((i + 1) * seg, 96)} Z`}
									fill={COLORS[i % COLORS.length]}
									stroke="#fff"
									strokeWidth="0.8"
								/>
							))
						)}
						{n >= 2 &&
							names.map((name, i) => (
								<text
									key={name}
									transform={`rotate(${(i + 0.5) * seg - 90} 100 100)`}
									x="90"
									y="100"
									textAnchor="end"
									dominantBaseline="middle"
									fill="#fff"
									fontSize={fontSize}
									fontWeight="600"
								>
									{name.length > 14 ? `${name.slice(0, 13)}…` : name}
								</text>
							))}
						<circle cx="100" cy="100" r="8" fill="#fff" stroke="#d1d5db" />
					</svg>
				</div>

				<button type="button" onClick={spin} disabled={spinning || n < 2} className="btn-primary w-full sm:w-auto">
					<RotateCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
					{spinning ? "Spinning…" : "Spin the wheel"}
				</button>

				<div aria-live="polite" className="min-h-[3.5rem] text-center">
					{winner && (
						<>
							<p className="label-text">Winner</p>
							<p className="font-display text-3xl font-semibold text-ink">{winner}</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
