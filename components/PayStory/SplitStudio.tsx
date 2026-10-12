"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { isValidUpiId } from "@/utils/upi";
import { encodeRequest, sharePerPerson, type SplitTemplate } from "@/utils/payStory";
import { themeGradient } from "./TemplateGrid";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const MAX_AVATARS = 12;

/** Eases a number toward its target so the per-person figure feels alive. */
const useTween = (value: number) => {
	const [shown, setShown] = useState(value);
	const from = useRef(value);
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(value);
		const start = performance.now();
		const begin = from.current;
		let raf = 0;
		const tick = (now: number) => {
			const p = Math.min((now - start) / 350, 1);
			const v = Math.round(begin + (value - begin) * (1 - (1 - p) ** 3));
			from.current = v;
			setShown(v);
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [value]);
	return shown;
};

/** The interactive page body: live split preview, then create the shareable link. */
export const SplitStudio = ({ template: t }: { template: SplitTemplate }) => {
	const [amount, setAmount] = useState(t.target ? String(t.target) : "");
	const [even, setEven] = useState(Boolean(t.people));
	const [people, setPeople] = useState(t.people ?? 4);
	const [title, setTitle] = useState(t.title);
	const [name, setName] = useState("");
	const [upiId, setUpiId] = useState("");
	const [error, setError] = useState("");

	const total = Math.round(Number(amount)) || 0;
	const each = even && total > 0 ? sharePerPerson({ target: total, people }) : 0;
	const shownEach = useTween(each);
	const shownTotal = useTween(total);
	const fg = t.theme.darkText ? "#1c1826" : "#ffffff";

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!(total >= 1)) return setError("Enter the amount you need.");
		if (!title.trim() || !name.trim()) return setError("Add a title and your name.");
		if (!isValidUpiId(upiId)) return setError("That UPI ID doesn’t look right (e.g. priya@okaxis).");
		track("split_link_created", { template: t.id, mode: even ? "even" : "free" });
		const req = {
			kind: t.id,
			title: title.trim(),
			name: name.trim(),
			upiId: upiId.trim(),
			target: total,
			people: even ? people : 0,
			paid: [] as [string, number][],
		};
		window.location.assign(`/pay-story#${encodeRequest(req)}`);
	};

	const field =
		"mt-1 w-full min-w-0 rounded-xl border border-line-strong bg-white px-3 py-2.5 text-base text-ink outline-none focus:border-brand-500 sm:text-sm";

	return (
		<form onSubmit={submit} className="surface space-y-6 p-5 sm:p-7">
			{/* Amount */}
			<div>
				<label htmlFor="ss-amount" className="label-text">Total to collect</label>
				<div className="mt-1 flex items-center gap-2 rounded-xl border border-line-strong bg-white px-4 focus-within:border-brand-500">
					<span className="font-display text-3xl text-ink-muted">₹</span>
					<input
						id="ss-amount"
						inputMode="numeric"
						value={amount}
						onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
						placeholder="0"
						className="w-full min-w-0 bg-transparent py-3 font-display text-4xl font-semibold tabular-nums text-ink outline-none"
					/>
				</div>
				<div className="mt-2 flex flex-wrap gap-2">
					{t.presets.map((p) => (
						<button
							type="button"
							key={p}
							onClick={() => setAmount(String(p))}
							aria-pressed={total === p}
							className={`rounded-full border px-3 py-1 text-sm font-medium ${
								total === p ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line-strong bg-white text-ink-soft hover:bg-paper"
							}`}
						>
							{inr(p)}
						</button>
					))}
				</div>
			</div>

			{/* Split mode */}
			<div>
				<span className="label-text">How should it be shared?</span>
				<div className="mt-1 grid grid-cols-2 gap-1 rounded-xl border border-line-strong bg-paper p-1" role="group" aria-label="Split mode">
					{[
						{ v: true, l: "Split evenly" },
						{ v: false, l: `Each ${t.who} chooses` },
					].map((o) => (
						<button
							type="button"
							key={String(o.v)}
							aria-pressed={even === o.v}
							onClick={() => setEven(o.v)}
							className={`rounded-lg px-2 py-2 text-sm font-semibold ${even === o.v ? "bg-white text-ink shadow-card" : "text-ink-muted"}`}
						>
							{o.l}
						</button>
					))}
				</div>
			</div>

			{/* Live preview */}
			<div className="overflow-hidden rounded-2xl p-5 text-center" style={{ background: themeGradient(t), color: fg }}>
				{even ? (
					<>
						<div className="mb-4 flex items-center justify-center gap-3">
							<button
								type="button"
								aria-label={`Fewer ${t.who}s`}
								onClick={() => setPeople((n) => Math.max(2, n - 1))}
								className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-semibold"
								style={{ background: "rgba(255,255,255,.25)" }}
							>
								−
							</button>
							<p className="min-w-[8ch] text-sm font-semibold" aria-live="polite">{people} {t.who}s</p>
							<button
								type="button"
								aria-label={`More ${t.who}s`}
								onClick={() => setPeople((n) => Math.min(50, n + 1))}
								className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-semibold"
								style={{ background: "rgba(255,255,255,.25)" }}
							>
								+
							</button>
						</div>
						<div className="mb-4 flex flex-wrap justify-center gap-1.5" aria-hidden>
							{Array.from({ length: Math.min(people, MAX_AVATARS) }, (_, i) => (
								<span
									key={i}
									className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
									style={{ background: "rgba(255,255,255,.3)" }}
								>
									{i + 1}
								</span>
							))}
							{people > MAX_AVATARS && <span className="self-center text-xs font-semibold">+{people - MAX_AVATARS}</span>}
						</div>
						<p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-80">Each {t.who} pays</p>
						<p className="font-display text-5xl font-semibold tabular-nums sm:text-6xl" aria-live="polite">{inr(shownEach)}</p>
						{each > 0 && each * people !== total && (
							<p className="mt-1 text-xs opacity-80">Rounded up so you collect {inr(each * people)}.</p>
						)}
					</>
				) : (
					<>
						<p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-80">Goal</p>
						<p className="font-display text-5xl font-semibold tabular-nums sm:text-6xl">{inr(shownTotal)}</p>
						<p className="mt-2 text-sm opacity-90">Everyone enters what they want to give. A progress bar shows how close you are.</p>
					</>
				)}
			</div>

			{/* Details */}
			<div className="space-y-3">
				<label className="block">
					<span className="label-text">What’s it for?</span>
					<input className={field} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Dinner tonight" />
				</label>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<label className="block">
						<span className="label-text">Your name</span>
						<input className={field} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
					</label>
					<label className="block">
						<span className="label-text">Your UPI ID</span>
						<input className={field} value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="priya@okaxis" autoCapitalize="none" autoCorrect="off" />
					</label>
				</div>
			</div>

			{error && <p role="alert" className="text-sm text-negative">{error}</p>}
			<button type="submit" className="btn-primary w-full !py-3.5 !text-base">Create split link</button>
			<p className="text-center text-xs text-ink-muted">
				No signup and no server: the split lives inside the link. Payments go straight to your UPI ID.
			</p>
		</form>
	);
};
