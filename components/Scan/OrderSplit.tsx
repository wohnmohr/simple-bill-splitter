"use client";

import { Plus, X } from "lucide-react";
import type { Currency } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { draftKey, draftShares, draftTotals, type DraftOrder } from "@/components/Scan/draft";

type Person = { id: string; name: string };

type Props = {
	draft: DraftOrder;
	onChange: (next: DraftOrder) => void;
	people: Person[];
	currency: Currency;
	/** Hide the per-person summary (when the host shows its own result). */
	hideShares?: boolean;
};

const field =
	"min-w-0 rounded-lg border border-line-strong bg-surface px-2.5 py-2 text-[15px] text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";

const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
	<button
		type="button"
		aria-pressed={on}
		onClick={onClick}
		className={`min-h-8 rounded-full px-3 text-[13px] font-medium transition-colors ${
			on ? "bg-ink text-on-ink" : "border border-line-strong bg-surface text-ink-soft hover:border-ink-muted"
		}`}
	>
		{children}
	</button>
);

/**
 * Review a scanned (or typed) order and say who had what: each item starts
 * as shared by everyone; tap names to give it to just those people.
 */
export const OrderSplit = ({ draft, onChange, people, currency, hideShares }: Props) => {
	const ids = people.map((p) => p.id);
	const totals = draftTotals(draft);
	const shares = draftShares(draft, ids);
	const fmt = (n: number) => formatCurrency(n, currency);

	const setItem = (key: string, patch: Partial<DraftOrder["items"][number]>) =>
		onChange({ ...draft, items: draft.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) });
	const setCharge = (key: string, patch: Partial<DraftOrder["charges"][number]>) =>
		onChange({ ...draft, charges: draft.charges.map((c) => (c.key === key ? { ...c, ...patch } : c)) });
	const toggle = (key: string, id: string) => {
		const item = draft.items.find((i) => i.key === key)!;
		const people = item.people.includes(id) ? item.people.filter((p) => p !== id) : [...item.people, id];
		setItem(key, { people: people.length === ids.length ? [] : people });
	};

	return (
		<div className="space-y-5">
			<section aria-labelledby="order-items">
				<div className="mb-2 flex items-baseline justify-between gap-3">
					<h3 id="order-items" className="text-[13px] font-semibold text-ink-soft">
						Who had what?
					</h3>
					<span className="text-xs text-ink-muted">Tap names to give an item to just them</span>
				</div>
				<ul className="divide-y divide-line rounded-xl border border-line">
					{draft.items.map((item, n) => (
						<li key={item.key} className="space-y-2 px-3 py-2.5">
							<div className="flex items-center gap-2">
								<input
									className={`${field} flex-1`}
									value={item.name}
									onChange={(e) => setItem(item.key, { name: e.target.value })}
									placeholder={`Item ${n + 1}`}
									aria-label={`Item ${n + 1} name`}
								/>
								<button
									type="button"
									className="icon-btn !h-8 !w-8 shrink-0"
									aria-label={`Remove ${item.name || `item ${n + 1}`}`}
									onClick={() => onChange({ ...draft, items: draft.items.filter((i) => i.key !== item.key) })}
								>
									<X className="h-4 w-4" />
								</button>
							</div>
							<div className="flex items-start gap-2">
								<div className="flex flex-1 flex-wrap gap-1.5" role="group" aria-label={`Who had ${item.name || `item ${n + 1}`}`}>
									<Chip on={item.people.length === 0} onClick={() => setItem(item.key, { people: [] })}>
										Everyone
									</Chip>
									{people.map((p) => (
										<Chip key={p.id} on={item.people.includes(p.id)} onClick={() => toggle(item.key, p.id)}>
											{p.name}
										</Chip>
									))}
								</div>
								<input
									className={`${field} w-24 shrink-0 text-right tabular-nums`}
									inputMode="decimal"
									value={item.amount}
									onChange={(e) => setItem(item.key, { amount: e.target.value })}
									placeholder="0"
									aria-label={`${item.name || `Item ${n + 1}`} amount`}
								/>
							</div>
						</li>
					))}
				</ul>
				<button
					type="button"
					onClick={() => onChange({ ...draft, items: [...draft.items, { key: draftKey(), name: "", amount: "", people: [] }] })}
					className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
				>
					<Plus className="h-4 w-4" /> Add an item
				</button>
			</section>

			<section aria-labelledby="order-charges">
				<h3 id="order-charges" className="mb-2 text-[13px] font-semibold text-ink-soft">
					Fees, taxes and discounts
				</h3>
				{draft.charges.length > 0 && (
					<ul className="space-y-2">
						{draft.charges.map((c) => (
							<li key={c.key} className="flex items-center gap-2">
								<input
									className={`${field} flex-1`}
									value={c.label}
									onChange={(e) => setCharge(c.key, { label: e.target.value })}
									aria-label="Charge name"
								/>
								<span className={`w-3 text-center font-semibold ${c.kind === "discount" ? "text-positive" : "text-ink-muted"}`} aria-hidden>
									{c.kind === "discount" ? "−" : "+"}
								</span>
								<input
									className={`${field} w-24 text-right tabular-nums`}
									inputMode="decimal"
									value={c.amount}
									onChange={(e) => setCharge(c.key, { amount: e.target.value })}
									aria-label={`${c.label} amount${c.kind === "discount" ? " (taken off)" : ""}`}
								/>
								<button
									type="button"
									className="icon-btn !h-8 !w-8 shrink-0"
									aria-label={`Remove ${c.label}`}
									onClick={() => onChange({ ...draft, charges: draft.charges.filter((x) => x.key !== c.key) })}
								>
									<X className="h-4 w-4" />
								</button>
							</li>
						))}
					</ul>
				)}
				<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
					{(
						[
							["fee", "Add a fee"],
							["tax", "Add tax"],
							["discount", "Add a discount"],
						] as const
					).map(([kind, label]) => (
						<button
							key={kind}
							type="button"
							onClick={() =>
								onChange({
									...draft,
									charges: [...draft.charges, { key: draftKey(), label: kind === "tax" ? "GST" : kind === "discount" ? "Discount" : "Delivery fee", kind, amount: "" }],
								})
							}
							className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
						>
							<Plus className="h-4 w-4" /> {label}
						</button>
					))}
				</div>
			</section>

			<section className="rounded-xl bg-paper p-3" aria-labelledby="order-total">
				<div className="flex items-center justify-between gap-3">
					<label id="order-total" htmlFor="order-total-input" className="font-semibold text-ink">
						Total paid
					</label>
					<input
						id="order-total-input"
						className={`${field} w-32 text-right text-base font-semibold tabular-nums`}
						inputMode="decimal"
						value={draft.total}
						onChange={(e) => onChange({ ...draft, total: e.target.value })}
						placeholder={String(totals.computed || "")}
					/>
				</div>
				<p className={`mt-2 text-sm tabular-nums ${totals.balanced ? "text-ink-muted" : "text-negative"}`} role={totals.balanced ? undefined : "alert"}>
					Items {fmt(totals.items)} {totals.charges < 0 ? "−" : "+"} extras {fmt(Math.abs(totals.charges))} = {fmt(totals.computed)}
					{!totals.balanced && ` — the bill says ${fmt(totals.total)}. Check the amounts above.`}
				</p>
			</section>

			{!hideShares && shares.length > 0 && (
				<section aria-labelledby="order-shares">
					<h3 id="order-shares" className="mb-2 text-[13px] font-semibold text-ink-soft">
						Each person’s share
					</h3>
					<ul className="divide-y divide-line rounded-xl border border-line">
						{shares.map((s) => (
							<li key={s.personId} className="flex items-center justify-between gap-3 px-3 py-2.5">
								<span className="font-medium text-ink">{people.find((p) => p.id === s.personId)?.name}</span>
								<span className="font-semibold tabular-nums text-ink">{fmt(s.amount)}</span>
							</li>
						))}
					</ul>
					<p className="mt-2 text-xs text-ink-muted">Fees, taxes and discounts are shared in proportion to what each person ordered.</p>
				</section>
			)}
		</div>
	);
};
