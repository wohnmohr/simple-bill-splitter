import { useState, type ReactNode } from "react";
import { NumberInput, TextInput } from "@mantine/core";
import { Repeat, X } from "lucide-react";
import { Modal } from "@/components/UI/Modal";
import { Button } from "@/components/UI/Button";
import type { Currency } from "@/types";
import { formatCurrency, fromDateInput, toDateInput } from "@/utils/formatting";
import type { QuickField, QuickPerson, QuickResolved, QuickResolvedExpense } from "@/utils/quickAdd";

interface QuickAddPreviewProps {
	quick: QuickResolved;
	currency: Currency;
	/** Creating a new group (asks for its name) rather than adding to the open one. */
	newGroup: boolean;
	onConfirm: (quick: QuickResolved, groupName: string, edited: boolean) => void;
	onClose: () => void;
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.01;

/** What still has to be fixed before an expense can be saved, or null. */
const problem = (e: QuickResolvedExpense): string | null => {
	if (!(e.amount > 0)) return "Add the amount.";
	if (!e.participants.length) return "Pick who it's split between.";
	if (!e.weights) return null;
	const sum = e.participants.reduce((s, k) => s + (e.weights![k] || 0), 0);
	if (e.splitMethod === "percentage" && !near(sum, 100)) return `Shares add up to ${Math.round(sum * 100) / 100}%, not 100%.`;
	if (e.splitMethod === "exact" && !near(sum, e.amount)) return `Shares add up to ${sum}, not ${e.amount}.`;
	return null;
};

/** Highlights a field the parser filled in or wasn't sure of, until it is touched. */
const Check = ({ on, children }: { on: boolean; children: ReactNode }) =>
	on ? (
		<div className="-mx-2 rounded-xl bg-amber-400/10 px-2 py-1.5 ring-1 ring-amber-500/60">
			{children}
			<p className="mt-1 text-xs font-medium text-amber-700">Check this: we guessed.</p>
		</div>
	) : (
		<>{children}</>
	);

/**
 * Shows what a typed sentence became, every part editable, before anything is
 * saved. Fields the parser guessed are highlighted until changed.
 */
export const QuickAddPreview = ({ quick, currency, newGroup, onConfirm, onClose }: QuickAddPreviewProps) => {
	const [people, setPeople] = useState(quick.people);
	const [expenses, setExpenses] = useState(quick.expenses);
	const [groupName, setGroupName] = useState(quick.groupName ?? quick.expenses[0]?.description ?? "");
	const [edited, setEdited] = useState(false);

	const used = new Set(expenses.flatMap((e) => [e.paidBy, ...e.participants]));
	const shown = people.filter((p) => !p.isNew || used.has(p.key));
	const newPeople = shown.filter((p) => p.isNew);
	const label = (p: QuickPerson) => (p.isMe ? (p.name ? `${p.name} (you)` : "You") : p.name || "Someone");
	const nameOf = (key: string) => label(people.find((p) => p.key === key)!);

	const editExpense = (i: number, change: Partial<QuickResolvedExpense>, touched?: QuickField) => {
		setEdited(true);
		setExpenses((prev) =>
			prev.map((e, j) => (j === i ? { ...e, ...change, unsure: e.unsure.filter((f) => f !== touched) } : e))
		);
	};
	const renamePerson = (key: string, name: string) => {
		setEdited(true);
		setPeople((prev) => prev.map((p) => (p.key === key ? { ...p, name, unsure: false } : p)));
	};
	/** "That's me": the person typing is a member the group already has. */
	const claimMe = (memberKey: string) => {
		const meKey = people.find((p) => p.isMe)!.key;
		const swap = (k: string) => (k === meKey ? memberKey : k);
		setEdited(true);
		setPeople((prev) => prev.filter((p) => p.key !== meKey).map((p) => (p.key === memberKey ? { ...p, isMe: true } : p)));
		setExpenses((prev) =>
			prev.map((e) => ({
				...e,
				paidBy: swap(e.paidBy),
				participants: [...new Set(e.participants.map(swap))],
				weights: e.weights && Object.fromEntries(Object.entries(e.weights).map(([k, v]) => [swap(k), v])),
			}))
		);
	};

	const errors = expenses.map(problem);
	const unnamed = newPeople.some((p) => !p.name.trim());
	const ready = expenses.length > 0 && errors.every((e) => !e) && !unnamed && (!newGroup || groupName.trim());

	return (
		<Modal isOpen onClose={onClose} title={newGroup ? "New group" : "Check and add"}>
			<div className="flex flex-col gap-5 pb-2">
				{newGroup && (
					<TextInput label="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={60} />
				)}

				{newPeople.length > 0 && (
					<fieldset>
						<legend className="mb-2 text-[13px] font-semibold text-ink-soft">
							{newGroup ? "People" : "New to this group"}
						</legend>
						<div className="flex flex-col gap-2">
							{newPeople.map((p) => (
								<Check key={p.key} on={p.unsure}>
									<TextInput
										aria-label={p.isMe ? "Your name" : `Name for ${p.name}`}
										placeholder={p.isMe ? "Your name" : "Name"}
										leftSection={p.isMe ? <span className="text-xs text-ink-muted">You</span> : undefined}
										leftSectionWidth={p.isMe ? 44 : undefined}
										value={p.name}
										onChange={(e) => renamePerson(p.key, e.target.value)}
										maxLength={40}
									/>
									{p.isMe && people.some((m) => !m.isNew) && (
										<div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
											Or you are
											{people.filter((m) => !m.isNew).map((m) => (
												<button key={m.key} type="button" onClick={() => claimMe(m.key)} className="rounded-full border border-line-strong px-3 py-1 font-medium text-ink hover:bg-paper">
													{m.name}
												</button>
											))}
										</div>
									)}
								</Check>
							))}
						</div>
					</fieldset>
				)}

				{expenses.map((e, i) => {
					const flagged = (f: QuickField) => e.unsure.includes(f);
					const each = e.participants.length ? e.amount / e.participants.length : 0;
					return (
						<section key={i} className="relative rounded-2xl border border-line p-3">
							{expenses.length > 1 && (
								<button
									type="button"
									onClick={() => setExpenses((prev) => prev.filter((_, j) => j !== i))}
									className="icon-btn absolute right-1.5 top-1.5"
									aria-label={`Remove ${e.description || "this expense"}`}
								>
									<X className="h-4 w-4" />
								</button>
							)}
							<div className="flex flex-col gap-3">
								<div className="grid grid-cols-[1fr_7.5rem] gap-2 pr-8">
									<TextInput
										aria-label="What for"
										placeholder="What for"
										value={e.description}
										onChange={(ev) => editExpense(i, { description: ev.target.value })}
										maxLength={100}
									/>
									<Check on={flagged("amount")}>
										<NumberInput
											aria-label="Amount"
											min={0}
											decimalScale={2}
											hideControls
											inputMode="decimal"
											leftSection={<span className="text-sm text-ink-muted">{currency.symbol}</span>}
											value={e.amount || ""}
											onChange={(v) => editExpense(i, { amount: Number(v) || 0 }, "amount")}
											classNames={{ input: "!font-semibold !tabular-nums" }}
										/>
									</Check>
								</div>

								{e.date !== undefined && (
									<label className="flex items-center gap-2 text-sm text-ink-soft">
										On
										<input
											type="date"
											value={toDateInput(e.date)}
											max={toDateInput(Date.now())}
											onChange={(ev) => ev.target.value && editExpense(i, { date: fromDateInput(ev.target.value) })}
											className="min-h-9 rounded-lg border border-line-strong bg-surface px-2 font-medium text-ink"
										/>
									</label>
								)}

								<Check on={flagged("payer")}>
									<label className="flex items-center gap-2 whitespace-nowrap text-sm text-ink-soft">
										Paid by
										<select
											value={e.paidBy}
											onChange={(ev) => editExpense(i, { paidBy: ev.target.value }, "payer")}
											className="min-h-9 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-2 font-medium text-ink"
										>
											{shown.map((p) => (
												<option key={p.key} value={p.key}>
													{label(p)}
												</option>
											))}
										</select>
									</label>
								</Check>

								<Check on={flagged("participants") || flagged("split")}>
									<p className="mb-1.5 text-sm text-ink-soft">
										Split between
										{!e.weights && each > 0 && <span className="text-ink-muted"> · {formatCurrency(each, currency)} each</span>}
									</p>
									<div className="flex flex-wrap gap-1.5">
										{shown.map((p) => {
											const on = e.participants.includes(p.key);
											return (
												<button
													key={p.key}
													type="button"
													aria-pressed={on}
													onClick={() => {
														const participants = on ? e.participants.filter((k) => k !== p.key) : [...e.participants, p.key];
														// Changing who's in resets a custom split to equal shares.
														editExpense(i, { participants, splitMethod: "equally", weights: undefined }, "participants");
													}}
													className={`min-h-9 rounded-full px-3 text-sm font-medium transition-colors ${
														on ? "bg-brand-700 text-on-brand" : "border border-line-strong text-ink-muted hover:bg-paper"
													}`}
												>
													{label(p)}
												</button>
											);
										})}
									</div>
									{e.weights && (
										<ul className="mt-2 flex flex-col gap-1.5">
											{e.participants.map((k) => (
												<li key={k} className="flex items-center gap-2 text-sm">
													<span className="flex-1 truncate text-ink">{nameOf(k)}</span>
													<NumberInput
														aria-label={`Share for ${nameOf(k)}`}
														min={0}
														decimalScale={2}
														hideControls
														inputMode="decimal"
														size="xs"
														w={96}
														rightSection={<span className="text-xs text-ink-muted">{e.splitMethod === "percentage" ? "%" : currency.symbol}</span>}
														value={e.weights![k] || ""}
														onChange={(v) => editExpense(i, { weights: { ...e.weights, [k]: Number(v) || 0 } }, "split")}
													/>
												</li>
											))}
										</ul>
									)}
								</Check>

								<Check on={flagged("repeat")}>
									<label className="flex items-center gap-2 text-sm text-ink-soft">
										<input
											type="checkbox"
											checked={e.monthly}
											onChange={(ev) => editExpense(i, { monthly: ev.target.checked }, "repeat")}
											className="h-4 w-4 accent-brand-700"
										/>
										<Repeat className="h-3.5 w-3.5" aria-hidden />
										Repeat every month
									</label>
								</Check>

								{errors[i] && <p className="text-sm text-negative">{errors[i]}</p>}
							</div>
						</section>
					);
				})}

				<p className="text-xs text-ink-muted">Read on this device. Nothing you typed was sent anywhere.</p>

				<div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-surface px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
					<Button variant="secondary" type="button" onClick={onClose} className="flex-1" size="md">
						Cancel
					</Button>
					<Button
						variant="primary"
						type="button"
						disabled={!ready}
						onClick={() => onConfirm({ ...quick, people, expenses }, groupName.trim(), edited)}
						className="flex-[2]"
						size="md"
					>
						{newGroup ? "Create group" : expenses.length === 1 ? "Add expense" : `Add ${expenses.length} expenses`}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
