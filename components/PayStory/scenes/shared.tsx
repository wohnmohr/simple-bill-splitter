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

/** Width for an inline input so it hugs its content. */
const fit = (text: string, min = 3) => `${Math.max(text.length, min) + 1}ch`;

export const Crumb = ({ t, className = "" }: { t: SplitTemplate; className?: string }) => (
	<nav aria-label="Breadcrumb" className={`text-sm opacity-75 ${className}`}>
		<Link href="/split" className="underline-offset-2 hover:underline">Splits</Link> / {t.label}
	</nav>
);

/** The amount, typed straight onto the scene. */
export const InlineAmount = ({ d, label = "Total amount", className = "", grow = false }: { d: SplitDraft; label?: string; className?: string; grow?: boolean }) => (
	<span className={`inline-flex min-w-0 items-baseline ${className}`}>
		<span aria-hidden>₹</span>
		<input
			aria-label={label}
			inputMode="numeric"
			value={d.amount}
			onChange={(e) => d.setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
			placeholder="0"
			className="inline-edit tabular-nums"
			style={{ width: grow ? "100%" : fit(d.amount) }}
		/>
	</span>
);

type TextProps = {
	value: string;
	onChange: (v: string) => void;
	label: string;
	placeholder: string;
	maxLength?: number;
	className?: string;
	grow?: boolean;
	upi?: boolean;
};

/** A word or line on the scene that you can edit in place. */
export const InlineText = ({ value, onChange, label, placeholder, maxLength = 60, className = "", grow = false, upi = false }: TextProps) => (
	<input
		aria-label={label}
		value={value}
		maxLength={maxLength}
		onChange={(e) => onChange(e.target.value)}
		placeholder={placeholder}
		className={`inline-edit ${upi ? "normal-case" : ""} ${className}`}
		style={{ width: grow ? "100%" : fit(value || placeholder, 4) }}
		{...(upi ? { autoCapitalize: "none", autoCorrect: "off", spellCheck: false, inputMode: "email" as const } : {})}
	/>
);

export const TitleField = (p: { d: SplitDraft; className?: string; grow?: boolean; placeholder?: string }) => (
	<InlineText value={p.d.title} onChange={p.d.setTitle} label="What it’s for" placeholder={p.placeholder ?? "What’s it for?"} className={p.className} grow={p.grow} />
);
export const NameField = (p: { d: SplitDraft; className?: string; grow?: boolean; placeholder?: string }) => (
	<InlineText value={p.d.name} onChange={p.d.setName} label="Your name" placeholder={p.placeholder ?? "Your name"} maxLength={40} className={p.className} grow={p.grow} />
);
export const UpiField = (p: { d: SplitDraft; className?: string; grow?: boolean }) => (
	<InlineText value={p.d.upiId} onChange={p.d.setUpiId} label="Your UPI ID" placeholder="you@okaxis" maxLength={80} className={p.className} grow={p.grow} upi />
);

/** − n + for the headcount, styled by the scene. */
export const Counter = ({ t, d, className = "", btn = "" }: { t: SplitTemplate; d: SplitDraft; className?: string; btn?: string }) => (
	<span className={`inline-flex items-center gap-2 ${className}`}>
		<button type="button" aria-label={`Fewer ${t.who}s`} onClick={() => d.setPeople(d.people - 1)} className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold ${btn}`}>−</button>
		<span className="min-w-[2ch] text-center tabular-nums" aria-live="polite" aria-label={`${d.people} ${t.who}s`}>{d.people}</span>
		<button type="button" aria-label={`More ${t.who}s`} onClick={() => d.setPeople(d.people + 1)} className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold ${btn}`}>+</button>
	</span>
);

/** Even split vs. any amount, as a two-way switch in the scene's own style. */
export const ModeSwitch = ({ d, labels = ["Split evenly", "Any amount"], className = "", on = "", off = "", onStyle }: { d: SplitDraft; labels?: [string, string]; className?: string; on?: string; off?: string; onStyle?: React.CSSProperties }) => (
	<span role="group" aria-label="How it’s shared" className={`inline-flex rounded-full p-0.5 ${className}`}>
		{[true, false].map((v, i) => (
			<button
				type="button"
				key={labels[i]}
				aria-pressed={d.even === v}
				onClick={() => d.setEven(v)}
				style={d.even === v ? onStyle : undefined}
				className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${d.even === v ? on : off}`}
			>
				{labels[i]}
			</button>
		))}
	</span>
);

/** Validation message, or the privacy promise when all is well. */
export const Note = ({ d, className = "" }: { d: SplitDraft; className?: string }) =>
	d.error ? (
		<p role="alert" className={`text-sm font-semibold ${className}`}>{d.error}</p>
	) : (
		<p className={`text-xs opacity-70 ${className}`}>No signup, no server: the split lives in the link and payments go straight to your UPI ID.</p>
	);

/** Deterministic bars for a decorative barcode. */
export const Barcode = ({ seed, className = "" }: { seed: string; className?: string }) => {
	const bars = Array.from({ length: 34 }, (_, i) => 1 + ((seed.charCodeAt(i % seed.length) * (i + 7)) % 3));
	return (
		<div aria-hidden className={`flex h-10 items-stretch gap-[2px] ${className}`}>
			{bars.map((w, i) => <span key={i} className="bg-current" style={{ width: w }} />)}
		</div>
	);
};
