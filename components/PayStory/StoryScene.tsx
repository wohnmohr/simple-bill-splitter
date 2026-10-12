import type { Occasion } from "@/utils/payStory";

const EASE = "transition-all duration-1000 ease-out";

/** One animated illustration per occasion, driven purely by progress (0–1). */
export const StoryScene = ({
	occasion,
	progress,
	slots,
}: {
	occasion: Occasion;
	progress: number;
	/** Pieces for the dinner bill (people, or 6 when open-ended). */
	slots: number;
}) => {
	const p = Math.min(1, Math.max(0, progress));
	return (
		<svg viewBox="0 0 200 180" className="mx-auto h-56 w-full max-w-xs" role="img" aria-label={`${Math.round(p * 100)}% paid`}>
			{occasion === "gift" && <Gift p={p} />}
			{occasion === "shagun" && <Envelope p={p} />}
			{occasion === "dinner" && <Bill p={p} slots={slots} />}
			{occasion === "birthday" && <Cake p={p} />}
		</svg>
	);
};

const Gift = ({ p }: { p: number }) => (
	<g>
		<defs>
			<clipPath id="gift-body">
				<rect x="40" y="70" width="120" height="95" rx="6" />
			</clipPath>
		</defs>
		<rect x="40" y="70" width="120" height="95" rx="6" fill="#ece3f5" />
		<g clipPath="url(#gift-body)">
			<rect
				x="40"
				width="120"
				fill="#9d73c7"
				className={EASE}
				style={{ y: 165 - 95 * p, height: 95 * p }}
			/>
		</g>
		<rect x="92" y="70" width="16" height="95" fill="#f5c453" />
		<g className={EASE} style={{ transform: `translateY(${-22 * p}px) rotate(${-6 * p}deg)`, transformOrigin: "100px 70px" }}>
			<rect x="32" y="50" width="136" height="24" rx="6" fill="#7e4fb0" />
			<rect x="92" y="50" width="16" height="24" fill="#f5c453" />
			<path d="M100 50c-20-26-38-4-14 0zM100 50c20-26 38-4 14 0z" fill="#f5c453" />
		</g>
	</g>
);

const Envelope = ({ p }: { p: number }) => (
	<g>
		<rect x="36" y="60" width="128" height="92" rx="8" fill="#d8c6ea" />
		{/* Notes slide up as the flap opens. */}
		<g className={EASE} style={{ transform: `translateY(${-38 * p}px)`, opacity: 0.25 + 0.75 * p }}>
			<rect x="56" y="76" width="88" height="56" rx="4" fill="#fff" stroke="#f5c453" strokeWidth="3" />
			<text x="100" y="112" textAnchor="middle" fontSize="26" fontWeight="700" fill="#11754c">₹</text>
		</g>
		<path d="M36 68l64 46 64-46v84a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8z" fill="#bd9fdb" />
		<g className={EASE} style={{ transform: `scaleY(${1 - 2 * p})`, transformOrigin: "100px 60px" }}>
			<path d="M36 60h128l-64 54z" fill="#9d73c7" />
		</g>
	</g>
);

const Bill = ({ p, slots }: { p: number; slots: number }) => {
	const n = Math.min(Math.max(slots, 2), 10);
	const paid = Math.floor(p * n + 1e-9);
	const w = 130 / n;
	return (
		<g>
			{Array.from({ length: n }, (_, i) => {
				const done = i < paid;
				const dir = i % 2 ? 1 : -1;
				return (
					<g
						key={i}
						className={EASE}
						style={{
							transform: done ? `translate(${dir * 14}px, ${-6 - (i % 3) * 4}px) rotate(${dir * 6}deg)` : "none",
							transformOrigin: `${35 + i * w + w / 2}px 90px`,
						}}
					>
						<rect x={35 + i * w + 1} y="20" width={w - 2} height="140" fill={done ? "#e8f4ee" : "#fff"} stroke={done ? "#11754c" : "#d4cfd9"} />
						<text x={35 + i * w + w / 2} y="95" textAnchor="middle" fontSize="12" fill="#11754c" opacity={done ? 1 : 0}>
							✓
						</text>
						{!done && <rect x={35 + i * w + 6} y="40" width={Math.max(w - 12, 2)} height="3" fill="#d4cfd9" />}
					</g>
				);
			})}
		</g>
	);
};

const Cake = ({ p }: { p: number }) => {
	const lit = Math.round(p * 5);
	return (
		<g>
			<rect x="42" y="110" width="116" height="48" rx="8" fill="#bd9fdb" />
			<rect x="52" y="82" width="96" height="34" rx="8" fill="#ece3f5" />
			<path d="M52 108q12 10 24 0t24 0 24 0 24 0" fill="none" stroke="#fff" strokeWidth="5" />
			{[0, 1, 2, 3, 4].map((i) => {
				const x = 68 + i * 16;
				const on = i < lit;
				return (
					<g key={i}>
						<rect x={x - 2} y="60" width="4" height="24" rx="1" fill="#f5c453" />
						<ellipse
							cx={x}
							cy="52"
							rx="5"
							ry="8"
							fill="#ff9f43"
							className={EASE}
							style={{ opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(0.3)", transformOrigin: `${x}px 60px` }}
						/>
					</g>
				);
			})}
		</g>
	);
};
