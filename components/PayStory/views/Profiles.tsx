"use client";

import type { SplitTemplate } from "@/utils/payStory";
import { MarkPaid, PayButton, ShareBar, Trust, YourAmount, inr, type PayState } from "./shared";

const COLORS = ["#e11d48", "#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#0891b2", "#db2777", "#65a30d"];

/** The profile picker: paid members light up with their names. */
export const ProfilesView = ({ t, p }: { t: SplitTemplate; p: PayState }) => {
	const { req } = p;
	const slots = Math.max(req.people, req.paid.length + (p.done ? 0 : 1));

	return (
		<section className="min-h-[calc(100dvh-3.5rem)] px-4 py-8 text-center text-white sm:py-12" style={{ background: `linear-gradient(180deg, ${t.theme.to}66, #141414 22rem), #141414` }}>
			<div className="mx-auto max-w-3xl">
				<p className="text-sm text-white/60">{t.emoji} {req.name} is sharing</p>
				<h1 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">{req.title}</h1>
				<p className="mt-2 text-white/70">{p.done ? "Everyone’s in. Enjoy the show." : `${inr(p.paid)} of ${inr(req.target)} paid`}</p>

				<ul className="mt-8 flex flex-wrap justify-center gap-5">
					{Array.from({ length: Math.min(slots, 10) }, (_, i) => {
						const payer = req.paid[i];
						const lit = Boolean(payer);
						return (
							<li key={i} className="w-20 sm:w-24">
								<span aria-hidden className="relative block aspect-square rounded-lg transition-opacity" style={{ background: COLORS[i % COLORS.length], opacity: lit ? 1 : 0.25 }}>
									<span className="absolute left-1/4 top-1/3 h-2 w-2 rounded-full bg-white/90" />
									<span className="absolute right-1/4 top-1/3 h-2 w-2 rounded-full bg-white/90" />
									<span className="absolute inset-x-0 bottom-3 mx-auto h-2 w-8 rounded-b-full border-b-4 border-white/90" />
									{payer && <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#141414]">✓</span>}
								</span>
								<p className="mt-2 truncate text-sm">{payer ? payer[0] : "Open seat"}</p>
								<p className="text-xs text-white/60">{payer ? inr(payer[1]) : p.share ? inr(p.share) : ""}</p>
							</li>
						);
					})}
				</ul>

				{!p.done && (
					<div className="mx-auto mt-10 max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/[.04] p-5">
						<p className="text-sm text-white/70">{p.share ? "Your share" : "Your amount"}</p>
						<p className="font-display text-4xl font-semibold"><YourAmount p={p} /></p>
						<PayButton p={p} className="w-full rounded-lg bg-white py-3 text-[#141414]">▶ Pay {p.amt ? inr(p.amt) : ""} and join</PayButton>
						<MarkPaid p={p} btnClass="bg-white text-[#141414]" />
					</div>
				)}
				<ShareBar p={p} t={t} className="mx-auto mt-6 max-w-md" primary="bg-white text-[#141414]" secondary="border border-white/20 text-white" />
				<Trust p={p} className="mx-auto mt-3 max-w-md" />
			</div>
		</section>
	);
};
