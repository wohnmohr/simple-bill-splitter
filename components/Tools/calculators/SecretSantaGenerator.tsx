"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Copy, Info, MessageCircle, Plus, Shuffle, X } from "lucide-react";
import { Exclusion, SantaPayload, drawSecretSanta, encodeRevealLink } from "@/utils/secretSanta";
import { fieldClass, labelClass, useCopy, useTrackResult } from "./shared";
import { track } from "@/lib/analytics";

type Draw = { links: { name: string; url: string }[]; event: string };

const CopyLink = ({ url }: { url: string }) => {
	const [copied, copy] = useCopy();
	return (
		<button type="button" onClick={() => copy(url)} className="btn-secondary !px-3 !py-2">
			{copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
			{copied ? "Copied" : "Copy link"}
		</button>
	);
};

/**
 * Secret Santa draw. The draw runs in the browser and the result is never
 * shown — each person gets a private reveal link containing only their match.
 */
export const SecretSantaGenerator = () => {
	const [event, setEvent] = useState("Office Secret Santa");
	const [namesText, setNamesText] = useState("Asha\nRohan\nMeera\nKabir\nIsha\nDev");
	const [budget, setBudget] = useState("₹500");
	const [date, setDate] = useState("");
	const [pairs, setPairs] = useState<Exclusion[]>([]);
	const [draw, setDraw] = useState<Draw | null>(null);
	const [error, setError] = useState<string | null>(null);
	const engagedRef = useRef(false);

	const engaged = () => {
		if (engagedRef.current) return;
		engagedRef.current = true;
		track("tool_calculator_engaged", { tool: "secret-santa-generator" });
	};

	const names = useMemo(() => {
		const seen = new Set<string>();
		return namesText
			.split(/[\n,]/)
			.map((s) => s.trim())
			.filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
	}, [namesText]);

	useTrackResult("secret-santa-generator", !!draw);

	const run = () => {
		engaged();
		setError(null);
		if (names.length < 3) {
			setDraw(null);
			setError("Add at least 3 people.");
			return;
		}
		const valid = pairs.filter(([a, b]) => a && b && a !== b && names.includes(a) && names.includes(b));
		const result = drawSecretSanta(names, valid);
		if (!result) {
			setDraw(null);
			setError("No draw is possible with those exclusions. Remove a pair or add more people.");
			return;
		}
		const origin = window.location.origin;
		setDraw({
			event,
			links: names.map((name) => {
				const payload: SantaPayload = {
					e: event.trim() || "Secret Santa",
					g: name,
					r: result[name],
					...(budget.trim() ? { b: budget.trim() } : {}),
					...(date.trim() ? { d: date.trim() } : {}),
				};
				return { name, url: encodeRevealLink(origin, payload) };
			}),
		});
	};

	const whatsapp = (name: string, url: string) =>
		`https://wa.me/?text=${encodeURIComponent(
			`🎁 ${event.trim() || "Secret Santa"}: hi ${name}! Open your private link to see who you're buying for (don't forward it):\n${url}`
		)}`;

	const updatePair = (i: number, side: 0 | 1, value: string) =>
		setPairs((prev) =>
			prev.map((p, j) => (j === i ? ((side === 0 ? [value, p[1]] : [p[0], value]) as Exclusion) : p))
		);

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
			<div className="surface space-y-4 p-4 sm:p-5">
				<div>
					<label className={labelClass} htmlFor="ss-event">
						Event name
					</label>
					<input
						id="ss-event"
						className={fieldClass}
						value={event}
						onChange={(e) => {
							engaged();
							setEvent(e.target.value);
						}}
						maxLength={60}
					/>
				</div>
				<div>
					<label className={labelClass} htmlFor="ss-names">
						Who’s playing? <span className="font-normal text-ink-muted">(one per line)</span>
					</label>
					<textarea
						id="ss-names"
						className={fieldClass}
						rows={6}
						value={namesText}
						onChange={(e) => {
							engaged();
							setNamesText(e.target.value);
							setDraw(null);
						}}
					/>
					<p className="mt-1 text-xs text-ink-muted">{names.length} people</p>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className={labelClass} htmlFor="ss-budget">
							Budget
						</label>
						<input
							id="ss-budget"
							className={fieldClass}
							value={budget}
							onChange={(e) => setBudget(e.target.value)}
							maxLength={30}
						/>
					</div>
					<div>
						<label className={labelClass} htmlFor="ss-date">
							Exchange date
						</label>
						<input
							id="ss-date"
							className={fieldClass}
							value={date}
							onChange={(e) => setDate(e.target.value)}
							placeholder="24 Dec"
							maxLength={30}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<span className={labelClass}>Shouldn’t draw each other (couples, siblings)</span>
					{pairs.map(([a, b], i) => (
						<div key={i} className="flex items-center gap-2">
							{[a, b].map((value, side) => (
								<select
									key={side}
									className={fieldClass}
									value={value}
									onChange={(e) => updatePair(i, side as 0 | 1, e.target.value)}
									aria-label={`Person ${side + 1} of pair ${i + 1}`}
								>
									<option value="">Choose…</option>
									{names.map((n) => (
										<option key={n} value={n}>
											{n}
										</option>
									))}
								</select>
							))}
							<button
								type="button"
								onClick={() => setPairs((prev) => prev.filter((_, j) => j !== i))}
								className="icon-btn"
								aria-label="Remove pair"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					))}
					<button
						type="button"
						onClick={() => setPairs((prev) => [...prev, ["", ""]])}
						className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
					>
						<Plus className="h-4 w-4" />
						Add a pair
					</button>
				</div>

				<button type="button" onClick={run} className="btn-primary w-full !py-3">
					<Shuffle className="h-4 w-4" />
					{draw ? "Draw again" : "Draw names"}
				</button>
				{error && (
					<p className="text-sm text-negative" role="alert">
						{error}
					</p>
				)}
			</div>

			<div className="space-y-4" aria-live="polite">
				{draw ? (
					<div className="surface shadow-raised space-y-3 p-4 sm:p-5">
						<div>
							<p className="label-text">Drawn — send each person their link</p>
							<p className="font-display text-xl font-semibold text-ink">{draw.event}</p>
						</div>
						<p className="flex items-start gap-2 rounded-xl bg-paper px-3 py-2.5 text-sm text-ink-soft">
							<Info className="mt-0.5 h-4 w-4 shrink-0" />
							<span>
								Matches aren’t shown here, so you can play too. Each link reveals only that
								person’s match — send it to its owner only, and don’t open the others.
							</span>
						</p>
						<ul className="divide-y divide-line rounded-xl border border-line">
							{draw.links.map(({ name, url }) => (
								<li key={name} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
									<span className="min-w-0 truncate font-medium text-ink">{name}</span>
									<span className="flex gap-2">
										<a
											href={whatsapp(name, url)}
											target="_blank"
											rel="noopener noreferrer"
											className="btn-secondary !px-3 !py-2"
											onClick={() => track("share_settlement_clicked", { method: "whatsapp", source: "tool:secret-santa" })}
										>
											<MessageCircle className="h-4 w-4" />
											WhatsApp
										</a>
										<CopyLink url={url} />
									</span>
								</li>
							))}
						</ul>
						<p className="text-xs text-ink-muted">
							Nothing is stored. If you draw again, the old links stop being right — tell
							everyone to use the new ones.
						</p>
					</div>
				) : (
					<div className="surface p-6 text-center text-sm text-ink-muted">
						Add everyone and tap “Draw names”.
					</div>
				)}
			</div>
		</div>
	);
};
