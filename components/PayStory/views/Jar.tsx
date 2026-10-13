"use client";

import { useEffect, useState } from "react";
import type { SplitTemplate } from "@/utils/payStory";
import { MarkPaid, PayButton, ShareBar, Trust, YourAmount, inr, type PayState } from "./shared";

const BODY = "M62 34 L62 52 Q30 62 30 104 L30 232 Q30 252 50 252 L150 252 Q170 252 170 232 L170 104 Q170 62 138 52 L138 34 Z";
const TOP = 70;
const BOTTOM = 252;

/** The jar fills to what's actually been collected; the tag lists who chipped in. */
export const JarView = ({ t, p }: { t: SplitTemplate; p: PayState }) => {
	const { req } = p;
	const [level, setLevel] = useState(0);
	useEffect(() => {
		const id = requestAnimationFrame(() => setLevel(p.progress));
		return () => cancelAnimationFrame(id);
	}, [p.progress]);
	const id = `jarv-${t.id}`;
	const grad = `linear-gradient(90deg, ${t.theme.from}, ${t.theme.to})`;

	return (
		<section className="min-h-[calc(100dvh-3.5rem)] px-4 py-8 sm:py-12" style={{ background: `linear-gradient(180deg, ${t.theme.from}14, #f7f6f3)` }}>
			<div className="mx-auto max-w-4xl">
				<div className="text-center text-ink">
					<p className="text-sm text-ink-muted">{t.emoji} {req.name} is collecting for</p>
					<h1 className="mt-1 font-display text-3xl font-semibold sm:text-5xl">{req.title}</h1>
				</div>
				<div className="mt-8 grid items-center gap-8 md:grid-cols-2">
					<figure className="mx-auto w-full max-w-[300px]">
						<svg viewBox="0 0 200 270" className="w-full" role="progressbar" aria-label="Amount collected" aria-valuenow={Math.round(p.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
							<defs>
								<clipPath id={`${id}-clip`}><path d={BODY} /></clipPath>
								<linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={t.theme.from} /><stop offset="1" stopColor={t.theme.to} /></linearGradient>
							</defs>
							<rect x="52" y="14" width="96" height="22" rx="6" fill={t.theme.to} />
							<path d={BODY} fill="#fff" fillOpacity=".6" />
							<g clipPath={`url(#${id}-clip)`}>
								<rect x="0" y={TOP} width="200" height={BOTTOM - TOP} fill={`url(#${id}-fill)`} style={{ transform: `scaleY(${level})`, transformOrigin: "bottom", transformBox: "fill-box", transition: "transform 1.4s cubic-bezier(.2,.8,.2,1)" }} />
							</g>
							<path d={BODY} fill="none" stroke="#1c1826" strokeOpacity=".25" strokeWidth="3" />
							<text x="100" y="160" textAnchor="middle" fontSize="26" fontWeight="700" fill={p.progress > 0.45 ? "#fff" : "#1c1826"}>{inr(p.paid)}</text>
							<text x="100" y="180" textAnchor="middle" fontSize="10" letterSpacing="1.5" fill={p.progress > 0.4 ? "#fff" : "#6b6578"}>OF {inr(req.target)}</text>
						</svg>
						<figcaption className="mt-2 text-center text-sm text-ink-muted">{p.done ? "Goal reached 🎉" : `${inr(p.remaining)} to go`}</figcaption>
					</figure>

					<div className="mx-auto w-full max-w-sm rotate-[-2deg] rounded-2xl bg-[#fffaf0] p-6 text-ink shadow-xl">
						<p className="font-display text-xl font-semibold italic">{p.done ? "Thank you, everyone!" : "Add yours to the jar"}</p>
						{req.paid.length > 0 && (
							<ul className="mt-3 flex flex-wrap gap-1.5">
								{req.paid.map(([n, a], i) => (
									<li key={i} className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: grad }}>{n} · {inr(a)}</li>
								))}
							</ul>
						)}
						{!p.done && (
							<div className="mt-4 space-y-3">
								<p className="flex items-baseline gap-2 font-display text-3xl font-semibold"><span className="text-sm font-normal text-ink-muted">I’ll add</span><YourAmount p={p} /></p>
								<PayButton p={p} className="w-full rounded-full py-2.5 text-white" style={{ background: grad }}>Drop {p.amt ? inr(p.amt) : ""} in by UPI 🎀</PayButton>
								<MarkPaid p={p} btnClass="text-white" btnStyle={{ background: t.theme.to }} />
							</div>
						)}
						<ShareBar p={p} t={t} className="mt-4" primary="text-white" primaryStyle={{ background: t.theme.to }} secondary="border border-ink/20" />
						<Trust p={p} className="mt-3" />
					</div>
				</div>
			</div>
		</section>
	);
};
