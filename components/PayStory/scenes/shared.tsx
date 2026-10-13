"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { isValidUpiId } from "@/utils/upi";
import { encodeRequest, sharePerPerson, type SplitTemplate } from "@/utils/payStory";

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const MIN_PEOPLE = 2;
const MAX_PEOPLE = 50;

/** All state behind a split page. Scenes only decide how it looks. */
export function useSplitDraft(t: SplitTemplate) {
	const [amount, setAmount] = useState(t.target ? String(t.target) : "");
	const [even, setEven] = useState(Boolean(t.people));
	const [people, setPeopleRaw] = useState(t.people ?? 4);
	const [title, setTitle] = useState(t.title);
	const [name, setName] = useState("");
	const [upiId, setUpiId] = useState("");
	const [error, setError] = useState("");

	const total = Math.round(Number(amount)) || 0;
	const each = even && total > 0 ? sharePerPerson({ target: total, people }) : 0;
	const setPeople = (n: number) => setPeopleRaw(Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, n)));

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

	return {
		amount, setAmount, total, each, even, setEven, people, setPeople,
		title, setTitle, name, setName, upiId, setUpiId, error, submit,
	};
}

export type SplitDraft = ReturnType<typeof useSplitDraft>;
export type Tone = "light" | "dark";

/** Eases a number toward its target so figures feel alive. */
export function useTween(value: number) {
	const [shown, setShown] = useState(value);
	const from = useRef(value);
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			from.current = value;
			return setShown(value);
		}
		const start = performance.now();
		const begin = from.current;
		let raf = 0;
		const tick = (now: number) => {
			const p = Math.min((now - start) / 380, 1);
			const v = Math.round(begin + (value - begin) * (1 - (1 - p) ** 3));
			from.current = v;
			setShown(v);
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [value]);
	return shown;
}

const TONES = {
	light: {
		label: "label-text",
		field: "border-line-strong bg-white text-ink placeholder:text-ink-muted/70 focus:border-brand-500",
		chip: "border-line-strong bg-white text-ink-soft hover:bg-paper",
		chipOn: "border-brand-600 bg-brand-50 text-brand-800",
		seg: "border-line-strong bg-paper",
		segOn: "bg-white text-ink shadow-card",
		segOff: "text-ink-muted",
		muted: "text-ink-muted",
		round: "border border-line-strong bg-white text-ink hover:bg-paper",
	},
	dark: {
		label: "text-xs font-medium uppercase tracking-[0.06em] text-white/60",
		field: "border-white/20 bg-white/5 text-white placeholder:text-white/35 focus:border-white/60",
		chip: "border-white/20 bg-transparent text-white/80 hover:bg-white/10",
		chipOn: "border-white bg-white text-[#111]",
		seg: "border-white/15 bg-white/5",
		segOn: "bg-white text-[#111]",
		segOff: "text-white/70",
		muted: "text-white/60",
		round: "border border-white/25 bg-white/10 text-white hover:bg-white/20",
	},
} as const;

export const Crumb = ({ t, className = "" }: { t: SplitTemplate; className?: string }) => (
	<nav aria-label="Breadcrumb" className={`text-sm opacity-75 ${className}`}>
		<Link href="/split" className="underline-offset-2 hover:underline">Splits</Link> / {t.label}
	</nav>
);

export const AmountInput = ({ d, tone = "light", label = "Total to collect" }: { d: SplitDraft; tone?: Tone; label?: string }) => (
	<div>
		<label htmlFor="sp-amount" className={TONES[tone].label}>{label}</label>
		<div className={`mt-1 flex items-center gap-2 rounded-xl border px-4 ${TONES[tone].field}`}>
			<span className="font-display text-2xl opacity-60">₹</span>
			<input
				id="sp-amount"
				inputMode="numeric"
				value={d.amount}
				onChange={(e) => d.setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
				placeholder="0"
				className="w-full min-w-0 bg-transparent py-2.5 font-display text-3xl font-semibold tabular-nums outline-none"
			/>
		</div>
	</div>
);

export const Presets = ({ t, d, tone = "light", format = inr }: { t: SplitTemplate; d: SplitDraft; tone?: Tone; format?: (n: number) => string }) => (
	<div className="flex flex-wrap gap-2">
		{t.presets.map((p) => (
			<button
				type="button"
				key={p}
				onClick={() => d.setAmount(String(p))}
				aria-pressed={d.total === p}
				className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${d.total === p ? TONES[tone].chipOn : TONES[tone].chip}`}
			>
				{format(p)}
			</button>
		))}
	</div>
);

export const ModeToggle = ({ t, d, tone = "light" }: { t: SplitTemplate; d: SplitDraft; tone?: Tone }) => (
	<div className={`grid grid-cols-2 gap-1 rounded-xl border p-1 ${TONES[tone].seg}`} role="group" aria-label="How it’s shared">
		{[
			{ v: true, l: "Split evenly" },
			{ v: false, l: "Any amount" },
		].map((o) => (
			<button
				type="button"
				key={String(o.v)}
				aria-pressed={d.even === o.v}
				title={o.v ? undefined : `Each ${t.who} chooses what to pay`}
				onClick={() => d.setEven(o.v)}
				className={`rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${d.even === o.v ? TONES[tone].segOn : TONES[tone].segOff}`}
			>
				{o.l}
			</button>
		))}
	</div>
);

export const Stepper = ({ t, d, tone = "light" }: { t: SplitTemplate; d: SplitDraft; tone?: Tone }) => (
	<div className="flex items-center gap-3">
		<button type="button" aria-label={`Fewer ${t.who}s`} onClick={() => d.setPeople(d.people - 1)} className={`h-10 w-10 shrink-0 rounded-full text-xl font-semibold ${TONES[tone].round}`}>−</button>
		<p className="min-w-[7.5rem] text-center text-sm font-semibold" aria-live="polite">{d.people} {t.who}s</p>
		<button type="button" aria-label={`More ${t.who}s`} onClick={() => d.setPeople(d.people + 1)} className={`h-10 w-10 shrink-0 rounded-full text-xl font-semibold ${TONES[tone].round}`}>+</button>
	</div>
);

/** Title, organiser and UPI ID, then the create button. Lives inside the scene's <form>. */
export const DetailsFields = ({ d, tone = "light", cta = "Create split link" }: { d: SplitDraft; tone?: Tone; cta?: string }) => {
	const f = `mt-1 w-full min-w-0 rounded-xl border px-3 py-2.5 text-base outline-none sm:text-sm ${TONES[tone].field}`;
	return (
		<div className="space-y-3">
			<label className="block">
				<span className={TONES[tone].label}>What’s it for?</span>
				<input className={f} value={d.title} maxLength={60} onChange={(e) => d.setTitle(e.target.value)} placeholder="Dinner tonight" />
			</label>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label className="block">
					<span className={TONES[tone].label}>Your name</span>
					<input className={f} value={d.name} maxLength={40} onChange={(e) => d.setName(e.target.value)} placeholder="Priya Sharma" />
				</label>
				<label className="block">
					<span className={TONES[tone].label}>Your UPI ID</span>
					<input className={f} value={d.upiId} onChange={(e) => d.setUpiId(e.target.value)} placeholder="priya@okaxis" autoCapitalize="none" autoCorrect="off" />
				</label>
			</div>
			{d.error && <p role="alert" className={`text-sm ${tone === "dark" ? "text-red-300" : "text-negative"}`}>{d.error}</p>}
			<button
				type="submit"
				className={`w-full !py-3.5 !text-base ${tone === "dark" ? "inline-flex items-center justify-center rounded-xl bg-white font-semibold text-[#111] hover:bg-white/90" : "btn-primary"}`}
			>
				{cta}
			</button>
			<p className={`text-center text-xs ${TONES[tone].muted}`}>
				No signup and no server: the split lives inside the link. Payments go straight to your UPI ID.
			</p>
		</div>
	);
};

/** Deterministic bars for a decorative barcode. */
export const Barcode = ({ seed, className = "" }: { seed: string; className?: string }) => {
	const bars = Array.from({ length: 34 }, (_, i) => 1 + ((seed.charCodeAt(i % seed.length) * (i + 7)) % 3));
	return (
		<div aria-hidden className={`flex h-10 items-stretch gap-[2px] ${className}`}>
			{bars.map((w, i) => <span key={i} className="bg-current" style={{ width: w }} />)}
		</div>
	);
};
