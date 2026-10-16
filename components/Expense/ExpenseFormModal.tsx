import React from "react";
import { TextInput, NumberInput, SegmentedControl } from "@mantine/core";
import { Check, Repeat } from "lucide-react";
import { Modal } from "@/components/UI/Modal";
import { Button } from "@/components/UI/Button";
import { Currency, Expense, Person, SplitMethod } from "@/types";
import type { ExpenseInput } from "@/hooks/useExpenses";
import { DEFAULT_CURRENCY } from "@/constants";
import { formatCurrency, fromDateInput, toDateInput } from "@/utils/formatting";
import { splitWeights } from "@/utils/calculations";
import { findDuplicate, looksMonthly, suggestPast } from "@/utils/suggestions";
import { track } from "@/lib/analytics";
import { OrderSplit } from "@/components/Scan/OrderSplit";
import { ScanOrderButton } from "@/components/Scan/ScanOrderButton";
import { useOrderScan } from "@/components/Scan/useOrderScan";
import { draftFromOrder, draftShares, draftTotals, emptyDraft, type DraftOrder } from "@/components/Scan/draft";

interface ExpenseFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (input: ExpenseInput) => void;
	people: Person[];
	/** The group's expenses, for suggestions on a new one. */
	history?: Expense[];
	currency?: Currency;
	/** Pre-selected payer for a new expense (the viewer, or whoever paid last). */
	defaultPayerId?: string;
	initialAmount?: string;
	initialPaidBy?: string;
	/** How much each person paid, when several did. */
	initialPayers?: Record<string, number>;
	initialParticipants?: Set<string>;
	initialDescription?: string;
	initialSplitMethod?: SplitMethod;
	initialWeights?: Record<string, number>;
	initialDate?: number;
	initialRepeat?: boolean;
	title?: string;
}

/** 1st, 2nd, 3rd, 4th … 31st. */
const ordinal = (n: number) => {
	const tens = n % 100;
	const suffix = tens >= 11 && tens <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
	return `${n}${suffix}`;
};

export const ExpenseFormModal = ({
	isOpen,
	onClose,
	onSubmit,
	people,
	history = [],
	currency = DEFAULT_CURRENCY,
	defaultPayerId,
	initialAmount = "",
	initialPaidBy = "",
	initialPayers,
	initialParticipants = new Set(),
	initialDescription = "",
	initialSplitMethod = "equally",
	initialWeights = {},
	initialDate,
	initialRepeat = false,
	title = "Add Expense",
}: ExpenseFormModalProps) => {
	const [amount, setAmount] = React.useState(initialAmount);
	const [paidBy, setPaidBy] = React.useState(initialPaidBy);
	// What each person put in, when several paid; null while one person paid it all.
	const [payerAmounts, setPayerAmounts] = React.useState<Record<string, number> | null>(initialPayers ?? null);
	const [participants, setParticipants] =
		React.useState<Set<string>>(initialParticipants);
	const [description, setDescription] = React.useState(initialDescription);
	const [splitMethod, setSplitMethod] =
		React.useState<SplitMethod>(initialSplitMethod);
	const [weights, setWeights] =
		React.useState<Record<string, number>>(initialWeights);
	const [date, setDate] = React.useState(toDateInput(initialDate ?? Date.now()));
	const [repeat, setRepeat] = React.useState(initialRepeat);
	// Splitting a food order item by item, from a screenshot or typed in.
	const [order, setOrder] = React.useState<DraftOrder | null>(null);
	const { state: scanState, scan, reset: resetScan } = useOrderScan("expense");
	const prevIsOpenRef = React.useRef(isOpen);
	const initialValuesRef = React.useRef({
		amount: initialAmount,
		paidBy: initialPaidBy,
		payers: initialPayers,
		participants: initialParticipants,
		description: initialDescription,
		splitMethod: initialSplitMethod,
		weights: initialWeights,
		date: initialDate,
		repeat: initialRepeat,
		defaultPayerId,
	});

	// Convert Set to sorted array for stable comparison
	const initialParticipantsArray = React.useMemo(
		() => Array.from(initialParticipants).sort().join(","),
		[initialParticipants]
	);

	// Update refs with latest initial values
	React.useEffect(() => {
		initialValuesRef.current = {
			amount: initialAmount,
			paidBy: initialPaidBy,
			payers: initialPayers,
			participants: initialParticipants,
			description: initialDescription,
			splitMethod: initialSplitMethod,
			weights: initialWeights,
			date: initialDate,
			repeat: initialRepeat,
			defaultPayerId,
		};
	}, [
		initialAmount,
		initialPaidBy,
		initialPayers,
		initialParticipantsArray,
		initialDescription,
		initialSplitMethod,
		initialWeights,
		initialDate,
		initialRepeat,
		defaultPayerId,
	]);

	const equalShares = (ids: Set<string>, total: number) => {
		const shares: Record<string, number> = {};
		if (ids.size === 0) return shares;
		const each = Math.round((total / ids.size) * 100) / 100;
		const list = Array.from(ids);
		list.forEach((id) => {
			shares[id] = each;
		});
		// Put the rounding remainder on the last person so the total is exact.
		shares[list[list.length - 1]] =
			Math.round((total - each * (list.length - 1)) * 100) / 100;
		return shares;
	};

	/** A custom split starts out even: 100% shared out, or the amount when there is one yet. */
	const startingWeights = (method: SplitMethod, ids: Set<string>, total: number) =>
		method === "percentage"
			? equalShares(ids, 100)
			: method === "exact" && total > 0
			? equalShares(ids, total)
			: {};

	// Only reset form when modal opens (transitions from closed to open)
	React.useEffect(() => {
		if (isOpen && !prevIsOpenRef.current) {
			const init = initialValuesRef.current;
			setAmount(init.amount);
			const payer =
				init.paidBy ||
				(init.defaultPayerId && people.some((p) => p.id === init.defaultPayerId)
					? init.defaultPayerId
					: people.length === 1
					? people[0].id
					: "");
			setPaidBy(payer);
			setPayerAmounts(init.payers ? { ...init.payers } : null);
			// If no initial participants (new expense), select all members by default
			const defaultParticipants =
				init.participants.size > 0
					? new Set(init.participants)
					: new Set(people.map((p) => p.id));
			setParticipants(defaultParticipants);
			setDescription(init.description);
			setSplitMethod(init.splitMethod);
			setDate(toDateInput(init.date ?? Date.now()));
			setRepeat(init.repeat);
			setOrder(null);
			resetScan();
			setWeights(
				Object.keys(init.weights).length > 0
					? { ...init.weights }
					: startingWeights(init.splitMethod, defaultParticipants, parseFloat(init.amount))
			);
		}
		prevIsOpenRef.current = isOpen;
	}, [isOpen, people]);

	const amountNum = parseFloat(amount);
	const hasAmount = amountNum > 0;
	const isPercentage = splitMethod === "percentage";
	const isExact = splitMethod === "exact";
	// A custom split has to add up: to 100%, or to the amount.
	const assigned = Math.round(
		Array.from(participants).reduce((sum, id) => sum + (weights[id] || 0), 0) * 100
	) / 100;
	const target = isPercentage ? 100 : amountNum;
	const splitOff = (isPercentage || isExact) && Math.abs(assigned - target) > 0.01;
	const paidTotal = payerAmounts ? Math.round(Object.values(payerAmounts).reduce((sum, n) => sum + n, 0) * 100) / 100 : 0;
	const hasPayer = payerAmounts ? paidTotal > 0 : !!paidBy;
	const paidOff = !!payerAmounts && hasAmount && Math.abs(paidTotal - amountNum) > 0.01;
	const canSubmit = hasAmount && hasPayer && !paidOff && participants.size > 0 && !splitOff;
	const unit = (n: number) => (isPercentage ? `${Math.round(n * 100) / 100}%` : formatCurrency(n, currency));
	const isEdit = title.includes("Edit");

	// Suggestions from this group's history, for new expenses only.
	const suggestions = isEdit ? [] : suggestPast(history, description);
	const monthlyHint = !isEdit && !repeat && looksMonthly(history, description);
	const duplicate = !isEdit && hasAmount ? findDuplicate(history, amountNum, date ? fromDateInput(date) : Date.now()) : undefined;

	/** Starts from a past expense: its details, its payer(s) and its split, among people still here. */
	const usePast = (e: Expense) => {
		const here = new Set(people.map((p) => p.id));
		const sharing = new Set(e.participants.filter((id) => here.has(id)));
		setDescription(e.description ?? "");
		if (!hasAmount) setAmount(e.amount.toString());
		const amountChanged = hasAmount && Math.abs(amountNum - e.amount) > 0.01;
		if (e.payers && !amountChanged && Object.keys(e.payers).every((id) => here.has(id))) setPayerAmounts({ ...e.payers });
		else if (here.has(e.paidBy)) {
			setPayerAmounts(null);
			setPaidBy(e.paidBy);
		}
		if (sharing.size === 0) return;
		setParticipants(sharing);
		// Exact amounts only fit the same total; percentages fit any.
		const method = e.splitMethod === "exact" && amountChanged ? "equally" : e.splitMethod;
		setSplitMethod(method);
		setWeights(method === "equally" ? {} : { ...splitWeights(e) });
		track("expense_suggestion_used", { kind: "past" });
	};

	// The button says what's still missing instead of just going grey.
	const submitLabel = !hasAmount
		? "Enter an amount"
		: !hasPayer
		? "Choose who paid"
		: paidOff
		? "Payments don't add up"
		: participants.size === 0
		? "Choose who shared it"
		: splitOff
		? isPercentage ? "Make it add up to 100%" : "Amounts don't add up"
		: isEdit
		? "Save changes"
		: duplicate
		? "Add it anyway"
		: "Add expense";

	const handleSubmit = () => {
		if (!canSubmit) return;
		// Someone given nothing of an exact split didn't share it.
		const sharing = isExact
			? new Set(Array.from(participants).filter((id) => (weights[id] || 0) > 0))
			: participants;
		onSubmit({
			amount: amountNum,
			paid: payerAmounts ?? { [paidBy]: amountNum },
			participants: sharing,
			description: description.trim() || undefined,
			splitMethod,
			weights:
				splitMethod === "equally"
					? undefined
					: Object.fromEntries(Array.from(sharing).map((id) => [id, weights[id] || 0])),
			date: date ? fromDateInput(date) : undefined,
			repeatMonthly: repeat,
		});
		// State is re-initialised when the modal next opens, so the closing
		// animation keeps showing what was just submitted.
		onClose();
	};

	const toggleParticipant = (personId: string) => {
		const next = new Set(participants);
		if (next.has(personId)) {
			next.delete(personId);
		} else {
			next.add(personId);
		}
		setParticipants(next);
		// Percentages re-balance; exact amounts keep what's been typed.
		if (isPercentage) setWeights(equalShares(next, 100));
	};

	const setAllParticipants = (all: boolean) => {
		const next = all ? new Set(people.map((p) => p.id)) : new Set<string>();
		setParticipants(next);
		if (isPercentage) setWeights(equalShares(next, 100));
	};

	/** Several payers start from whoever was picked, holding the whole amount. */
	const toggleSeveralPayers = () => {
		if (payerAmounts) {
			const top = Object.entries(payerAmounts).sort((a, b) => b[1] - a[1])[0];
			if (top) setPaidBy(top[0]);
			setPayerAmounts(null);
		} else {
			setPayerAmounts(paidBy ? { [paidBy]: hasAmount ? amountNum : 0 } : {});
		}
	};

	const setPayerAmount = (personId: string, value: number | undefined) => {
		const { [personId]: _old, ...rest } = payerAmounts ?? {};
		setPayerAmounts(value ? { ...rest, [personId]: value } : rest);
	};

	const handleWeightChange = (personId: string, value: number | undefined) => {
		const next = { ...weights };
		if (value !== undefined && value >= 0 && (!isPercentage || value <= 100)) {
			next[personId] = value;
		} else {
			delete next[personId];
		}
		setWeights(next);
	};

	const shareOf = (id: string) =>
		!hasAmount
			? 0
			: isPercentage
			? (amountNum * (weights[id] || 0)) / 100
			: participants.size > 0
			? amountNum / participants.size
			: 0;
	const allSelected = participants.size === people.length;

	/** The order's shares become an exact split; who paid is still chosen here. */
	const applyOrder = (draft: DraftOrder) => {
		const shares = draftShares(draft, people.map((p) => p.id));
		const { total } = draftTotals(draft);
		setAmount(total > 0 ? total.toString() : "");
		if (draft.title.trim()) setDescription(draft.title.trim().slice(0, 80));
		setSplitMethod("exact");
		setParticipants(new Set(shares.map((s) => s.personId)));
		setWeights(Object.fromEntries(shares.map((s) => [s.personId, s.amount])));
		setOrder(null);
		track("order_split_used", { where: "expense", items: draft.items.length, people: shares.length });
	};

	if (order) {
		const shares = draftShares(order, people.map((p) => p.id));
		const ready = draftTotals(order).total > 0 && shares.length > 0;
		return (
			<Modal isOpen={isOpen} onClose={onClose} title="Split the order">
				<div className="flex flex-col gap-5 pb-2">
					<OrderSplit draft={order} onChange={setOrder} people={people} currency={currency} />
					<div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-surface px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
						<Button variant="secondary" type="button" onClick={() => setOrder(null)} className="flex-1" size="md">
							Back
						</Button>
						<Button variant="primary" type="button" disabled={!ready} onClick={() => applyOrder(order)} className="flex-[2]" size="md">
							Use these amounts
						</Button>
					</div>
				</div>
			</Modal>
		);
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit expense" : "Add an expense"}>
			<form
				className="flex flex-col gap-5 pb-2"
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				{!isEdit && people.length > 1 && (
					<div>
						<ScanOrderButton
							state={scanState}
							onFile={async (file) => {
								const parsed = await scan(file);
								if (parsed) setOrder(draftFromOrder(parsed));
							}}
						/>
						<button type="button" onClick={() => setOrder(emptyDraft())} className="mt-1 text-sm font-medium text-brand-700 hover:underline">
							or split a bill item by item
						</button>
					</div>
				)}

				<NumberInput
					label="Amount"
					value={amount ? parseFloat(amount) : ""}
					onChange={(value) => setAmount(value === "" ? "" : value.toString())}
					placeholder="0"
					min={0}
					decimalScale={2}
					thousandSeparator=","
					thousandsGroupStyle={currency.code === "INR" ? "lakh" : "thousand"}
					hideControls
					inputMode="decimal"
					data-autofocus
					size="lg"
					leftSection={
						<span className="text-2xl font-semibold text-ink-muted" aria-hidden>
							{currency.symbol}
						</span>
					}
					leftSectionWidth={44}
					classNames={{ input: "!text-2xl !font-semibold !tabular-nums" }}
				/>

				<div className="grid grid-cols-[1fr_auto] gap-3">
					<TextInput
						label="What was it for?"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Dinner, cab, groceries…"
						maxLength={80}
					/>
					<TextInput
						label="Date"
						type="date"
						value={date}
						max={toDateInput(Date.now())}
						onChange={(e) => setDate(e.target.value)}
						w={148}
					/>
				</div>

				{suggestions.length > 0 && (
					<div className="-mt-2 flex flex-wrap gap-2" aria-label="Add one like before">
						{suggestions.map((e) => (
							<button
								key={e.id}
								type="button"
								onClick={() => usePast(e)}
								className="min-h-9 max-w-full truncate rounded-full border border-line-strong bg-surface px-3 text-sm text-ink-soft hover:border-ink-muted hover:text-ink"
							>
								{e.description} · {formatCurrency(e.amount, currency)}
							</button>
						))}
					</div>
				)}

				<fieldset>
					<legend className="mb-2 flex w-full items-center justify-between gap-3 text-[13px] font-semibold text-ink-soft">
						Paid by
						{people.length > 1 && (
							<button type="button" onClick={toggleSeveralPayers} className="text-sm font-medium text-brand-700 hover:underline">
								{payerAmounts ? "One person paid" : "Several people paid"}
							</button>
						)}
					</legend>
					{payerAmounts ? (
						<>
							<ul className="divide-y divide-line rounded-xl border border-line">
								{people.map((person) => (
									<li key={person.id} className="flex items-center gap-3 px-3 py-2">
										<span className={`min-w-0 flex-1 truncate ${payerAmounts[person.id] ? "font-medium text-ink" : "text-ink-muted"}`}>
											{person.name}
										</span>
										<NumberInput
											aria-label={`What ${person.name} paid`}
											value={payerAmounts[person.id] ?? ""}
											onChange={(value) => setPayerAmount(person.id, value === "" ? undefined : parseFloat(value.toString()))}
											placeholder="0"
											min={0}
											decimalScale={2}
											prefix={currency.symbol}
											thousandSeparator=","
											thousandsGroupStyle={currency.code === "INR" ? "lakh" : "thousand"}
											hideControls
											inputMode="decimal"
											size="sm"
											w={108}
											styles={{ input: { minHeight: 36, fontSize: 15, textAlign: "right" } }}
										/>
									</li>
								))}
							</ul>
							{!hasAmount && paidTotal > 0 ? (
								<button
									type="button"
									onClick={() => setAmount(paidTotal.toString())}
									className="mt-2 text-sm font-medium text-brand-700 hover:underline"
								>
									Use {formatCurrency(paidTotal, currency)} as the amount
								</button>
							) : (
								hasAmount && (
									<p className={`mt-2 text-sm tabular-nums ${paidOff ? "text-negative" : "text-ink-muted"}`} role={paidOff ? "alert" : undefined}>
										{formatCurrency(paidTotal, currency)} of {formatCurrency(amountNum, currency)} paid
										{paidOff &&
											` — ${formatCurrency(Math.round(Math.abs(amountNum - paidTotal) * 100) / 100, currency)} ${paidTotal < amountNum ? "still to add" : "too much"}`}
									</p>
								)
							)}
						</>
					) : (
						<div className="flex flex-wrap gap-2">
							{people.map((person) => {
								const selected = paidBy === person.id;
								return (
									<button
										key={person.id}
										type="button"
										aria-pressed={selected}
										onClick={() => setPaidBy(person.id)}
										className={`min-h-10 rounded-full px-4 text-sm font-medium transition-colors ${
											selected
												? "bg-ink text-on-ink"
												: "border border-line-strong bg-surface text-ink-soft hover:border-ink-muted hover:text-ink"
										}`}
									>
										{person.name}
									</button>
								);
							})}
						</div>
					)}
				</fieldset>

				<fieldset>
					<legend className="mb-2 text-[13px] font-semibold text-ink-soft">
						Split
					</legend>
					<SegmentedControl
						fullWidth
						radius="md"
						value={splitMethod}
						onChange={(value) => {
							const method = value as SplitMethod;
							setSplitMethod(method);
							setWeights(startingWeights(method, participants, amountNum));
						}}
						data={[
							{ value: "equally", label: "Equally" },
							{ value: "percentage", label: "By %" },
							{ value: "exact", label: "By amount" },
						]}
					/>

					<div className="mb-1.5 mt-3 flex items-center justify-between gap-3">
						<span className="text-sm text-ink-muted">
							Between {participants.size} of {people.length}
						</span>
						<button
							type="button"
							onClick={() => setAllParticipants(!allSelected)}
							className="text-sm font-medium text-brand-700 hover:underline"
						>
							{allSelected ? "Clear all" : "Select all"}
						</button>
					</div>

					<ul className="divide-y divide-line rounded-xl border border-line">
						{people.map((person) => {
							const selected = participants.has(person.id);
							return (
								<li key={person.id} className="flex items-center gap-3 px-3 py-2">
									<button
										type="button"
										role="checkbox"
										aria-checked={selected}
										onClick={() => toggleParticipant(person.id)}
										className="flex min-h-9 flex-1 min-w-0 items-center gap-3 text-left"
									>
										<span
											className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
												selected
													? "border-brand-700 bg-brand-700 text-on-brand"
													: "border-line-strong bg-surface"
											}`}
											aria-hidden
										>
											{selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
										</span>
										<span
											className={`truncate ${selected ? "font-medium text-ink" : "text-ink-muted"}`}
										>
											{person.name}
										</span>
									</button>
									{selected && hasAmount && !isExact && (
										<span className="shrink-0 text-sm tabular-nums text-ink-muted">
											{formatCurrency(Math.round(shareOf(person.id) * 100) / 100, currency)}
										</span>
									)}
									{selected && (isPercentage || isExact) && (
										<NumberInput
											aria-label={`${person.name}'s ${isPercentage ? "percentage" : "amount"}`}
											value={weights[person.id] ?? 0}
											onChange={(value) =>
												handleWeightChange(
													person.id,
													value === "" ? undefined : parseFloat(value.toString())
												)
											}
											min={0}
											max={isPercentage ? 100 : undefined}
											decimalScale={2}
											{...(isPercentage ? { suffix: "%" } : { prefix: currency.symbol })}
											thousandSeparator={isExact ? "," : undefined}
											thousandsGroupStyle={currency.code === "INR" ? "lakh" : "thousand"}
											hideControls
											inputMode="decimal"
											size="sm"
											w={isPercentage ? 84 : 108}
											styles={{ input: { minHeight: 36, fontSize: 15, textAlign: "right" } }}
										/>
									)}
								</li>
							);
						})}
					</ul>

					{isExact && !hasAmount && assigned > 0 ? (
						// Typed everyone's share first? Their total is the amount.
						<button
							type="button"
							onClick={() => setAmount(assigned.toString())}
							className="mt-2 text-sm font-medium text-brand-700 hover:underline"
						>
							Use {unit(assigned)} as the amount
						</button>
					) : (
						(isPercentage || (isExact && hasAmount)) &&
						participants.size > 0 && (
							<p
								className={`mt-2 text-sm tabular-nums ${splitOff ? "text-negative" : "text-ink-muted"}`}
								role={splitOff ? "alert" : undefined}
							>
								{isPercentage ? `Total ${unit(assigned)}` : `${unit(assigned)} of ${unit(target)}`}
								{splitOff &&
									` — ${unit(Math.abs(target - assigned))} ${
										assigned < target ? "still to assign" : "too much"
									}`}
							</p>
						)
					)}
				</fieldset>

				<button
					type="button"
					role="switch"
					aria-checked={repeat}
					onClick={() => setRepeat(!repeat)}
					className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${monthlyHint ? "border-brand-700 bg-brand-50" : "border-line"}`}
				>
					<Repeat className={`h-4 w-4 shrink-0 ${repeat ? "text-brand-700" : "text-ink-muted"}`} aria-hidden />
					<span className="min-w-0 flex-1">
						<span className="block text-sm font-medium text-ink">Repeat every month</span>
						<span className="block text-xs text-ink-muted">
							{repeat && date
								? `Added again on the ${ordinal(Number(date.slice(8)))} of each month`
								: monthlyHint
								? `You add ${description.trim()} most months. Turn this on and it's added for you.`
								: "For rent, Wi-Fi and subscriptions"}
						</span>
					</span>
					<span
						className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${repeat ? "bg-brand-700" : "bg-line-strong"}`}
						aria-hidden
					>
						<span
							className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-[left] ${repeat ? "left-[18px]" : "left-0.5"}`}
						/>
					</span>
				</button>

				{duplicate && (
					<p role="alert" className="rounded-xl bg-paper px-3 py-2.5 text-sm text-ink-soft">
						{people.find((p) => p.id === duplicate.paidBy)?.name ?? "Someone"} already added{" "}
						<span className="font-medium text-ink">{duplicate.description || "an expense"}</span> for{" "}
						{formatCurrency(duplicate.amount, currency)} on{" "}
						{new Date(duplicate.createdAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}. Add this only if
						it&apos;s a separate bill.
					</p>
				)}

				<div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-surface px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
					<Button variant="secondary" type="button" onClick={onClose} className="flex-1" size="md">
						Cancel
					</Button>
					<Button variant="primary" type="submit" disabled={!canSubmit} className="flex-[2]" size="md">
						{submitLabel}
					</Button>
				</div>
			</form>
		</Modal>
	);
};
