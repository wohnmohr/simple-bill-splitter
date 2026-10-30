"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Currency, Expense, Person } from "@/types";
import { CURRENCIES } from "@/constants";
import { calculateSettlements } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatting";
import { ShareSettlementActions } from "@/components/Share/ShareSettlementActions";
import { ArrowRight, Check, FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics";
import { IMPORT_LIMIT_MESSAGE, importShareSnapshot } from "@/utils/shareImport";

export function makePeople(names: string[]): Person[] {
	return names
		.map((n) => n.trim())
		.filter(Boolean)
		.map((name, i) => ({ id: `p${i + 1}`, name }));
}

export function makeEqualExpense(
	amount: number,
	people: Person[],
	paidBy: string,
	description: string
): Expense {
	return {
		id: "exp-1",
		amount,
		paidBy,
		participants: people.map((p) => p.id),
		description,
		splitMethod: "equally",
	};
}

type ResultPanelProps = {
	title: string;
	people: Person[];
	expenses: Expense[];
	currency: Currency;
	/** Label for the button that saves this split as a group in the app. */
	ctaLabel?: string;
	extra?: ReactNode;
	tool?: string;
};

export const CalculatorResult = ({
	title,
	people,
	expenses,
	currency,
	ctaLabel = "Save as a group",
	extra,
	tool = "calculator",
}: ResultPanelProps) => {
	const trackedKey = useRef<string | null>(null);
	const router = useRouter();
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	/** Carry the split into the app as a new group and open it there. */
	const saveAsGroup = () => {
		const me = people.find((p) => p.name.trim().toLowerCase() === "you");
		const result = importShareSnapshot(
			{ name: title, currency, members: people, expenses: expenses.map((e) => ({ ...e, createdAt: Date.now() })) },
			me?.id
		);
		if (!result.ok) {
			track("calculator_save_failed", { tool, reason: result.reason });
			setSaveError(result.reason === "limit" ? IMPORT_LIMIT_MESSAGE : "Add at least one person first.");
			return;
		}
		setSaved(true); // one tap, one group, while the dashboard loads
		track("calculator_saved_as_group", { tool, member_count: people.length, expense_count: expenses.length, currency: currency.code });
		router.push("/dashboard");
	};

	useEffect(() => {
		if (people.length < 2 || expenses.length === 0) return;
		const key = `${tool}:${people.length}:${expenses.length}:${currency.code}`;
		if (trackedKey.current === key) return;
		trackedKey.current = key;
		track("calculator_result_viewed", {
			tool,
			member_count: people.length,
			expense_count: expenses.length,
			currency: currency.code,
			settlement_count: calculateSettlements(people, expenses).length,
		});
	}, [people, expenses, currency.code, tool]);

	if (people.length < 2 || expenses.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-indigo-200 bg-surface/60 p-6 text-center text-sm text-ink-muted">
				Fill in the calculator to see who owes whom.
			</div>
		);
	}

	const settlements = calculateSettlements(people, expenses);
	const total = expenses.reduce((s, e) => s + e.amount, 0);

	return (
		<div className="surface shadow-raised p-4 sm:p-5 space-y-4 animate-[fade-in-up_0.4s_ease-out]">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="label-text">
						Result
					</p>
					<h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
					<p className="text-sm text-ink-muted">
						Total {formatCurrency(total, currency)} · {people.length} people
					</p>
				</div>
			</div>

			{settlements.length === 0 ? (
				<div className="flex items-center gap-2 text-positive bg-positive-soft rounded-xl px-3 py-2 text-sm">
					<Check className="h-4 w-4" />
					Everyone is settled up
				</div>
			) : (
				<ul className="space-y-2">
					{settlements.map((s, i) => {
						const from = people.find((p) => p.id === s.from)?.name;
						const to = people.find((p) => p.id === s.to)?.name;
						return (
							<li
								key={i}
								className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2.5"
							>
								<span className="text-sm font-semibold text-ink flex items-center gap-1.5 min-w-0">
									<span className="truncate">{from}</span>
									<ArrowRight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
									<span className="truncate">{to}</span>
								</span>
								<span className="font-semibold tabular-nums text-ink shrink-0">
									{formatCurrency(s.amount, currency)}
								</span>
							</li>
						);
					})}
				</ul>
			)}

			{extra}

			{/* The result is the start of a group, not the end of the tool. */}
			<div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
				<p className="font-semibold text-ink">Keep it as a group</p>
				<p className="mt-0.5 text-sm text-ink-soft">
					Opens in SplitBiller with all of this filled in. Invite everyone with one link: they pay by UPI and add the next
					expense themselves. No signup.
				</p>
				<button type="button" onClick={saveAsGroup} disabled={saved} className="btn-primary mt-3 w-full !justify-center !py-3">
					<FolderPlus className="h-4 w-4" />
					{ctaLabel}
				</button>
				{saveError && (
					<p className="mt-2 text-center text-sm text-negative" role="alert">
						{saveError}
					</p>
				)}
			</div>

			<div className="flex items-center justify-between gap-3">
				<p className="text-sm text-ink-muted">Or just send the result</p>
				<ShareSettlementActions
					name={title}
					people={people}
					expenses={expenses}
					currency={currency}
					source={`tool:${tool}`}
				/>
			</div>
		</div>
	);
};

export const fieldClass =
	"w-full min-w-0 rounded-xl border border-line bg-surface px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export const labelClass = "block text-sm font-medium text-ink-soft mb-1";

export function CurrencySelect({
	value,
	onChange,
	allowed,
}: {
	value: Currency;
	onChange: (c: Currency) => void;
	allowed?: string[];
}) {
	const list = allowed
		? CURRENCIES.filter((c) => allowed.includes(c.code))
		: CURRENCIES;
	return (
		<select
			className={fieldClass}
			value={value.code}
			onChange={(e) => {
				const next = CURRENCIES.find((c) => c.code === e.target.value);
				if (next) onChange(next);
			}}
		>
			{list.map((c) => (
				<option key={c.code} value={c.code}>
					{c.symbol} {c.code}
				</option>
			))}
		</select>
	);
}

export function useDefaultCurrency(code = "INR"): [Currency, (c: Currency) => void] {
	const initial = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
	return useState<Currency>(initial);
}

/** Copy text to the clipboard and flash a "copied" state. */
export function useCopy(): [boolean, (text: string) => Promise<void>] {
	const [copied, setCopied] = useState(false);
	const copy = useCallback(async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* clipboard unavailable */
		}
	}, []);
	return [copied, copy];
}

/** Reports that a tool produced a result, once per page view. */
export function useTrackResult(tool: string, ready: boolean) {
	const sent = useRef(false);
	useEffect(() => {
		if (!ready || sent.current) return;
		sent.current = true;
		track("calculator_result_viewed", { tool });
	}, [ready, tool]);
}

/** Fires `tool_calculator_engaged` on a visitor's first interaction. */
export function useEngaged(tool: string): () => void {
	const sent = useRef(false);
	return useCallback(() => {
		if (sent.current) return;
		sent.current = true;
		track("tool_calculator_engaged", { tool });
	}, [tool]);
}

/** Unbiased random integer in [0, max) from the Web Crypto API. */
export function randomInt(max: number): number {
	const buf = new Uint32Array(1);
	const limit = Math.floor(0x100000000 / max) * max;
	do crypto.getRandomValues(buf);
	while (buf[0] >= limit);
	return buf[0] % max;
}

/** Fisher–Yates shuffle returning a new array. */
export function shuffled<T>(items: readonly T[]): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = randomInt(i + 1);
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** Parses a one-per-line / comma-separated list into unique, trimmed names. */
export function parseNames(text: string): string[] {
	const seen = new Set<string>();
	return text
		.split(/[\n,]/)
		.map((s) => s.trim())
		.filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
}
