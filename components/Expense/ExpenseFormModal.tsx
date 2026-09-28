import React from "react";
import { TextInput, NumberInput, SegmentedControl } from "@mantine/core";
import { Check } from "lucide-react";
import { Modal } from "@/components/UI/Modal";
import { Button } from "@/components/UI/Button";
import { Currency, Person, SplitMethod } from "@/types";
import { DEFAULT_CURRENCY } from "@/constants";
import { formatCurrency } from "@/utils/formatting";

interface ExpenseFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (
		amount: number,
		paidBy: string,
		participants: Set<string>,
		description?: string,
		splitMethod?: SplitMethod,
		percentages?: Record<string, number>,
		date?: number
	) => void;
	people: Person[];
	currency?: Currency;
	/** Pre-selected payer for a new expense (the viewer, or whoever paid last). */
	defaultPayerId?: string;
	initialAmount?: string;
	initialPaidBy?: string;
	initialParticipants?: Set<string>;
	initialDescription?: string;
	initialSplitMethod?: SplitMethod;
	initialPercentages?: Record<string, number>;
	initialDate?: number;
	title?: string;
}

/** yyyy-mm-dd in local time, for <input type="date">. */
const toDateInput = (ms: number) => {
	const d = new Date(ms);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Local noon of the chosen day, so time zones never shift the date. */
const fromDateInput = (value: string) => {
	const [y, m, d] = value.split("-").map(Number);
	return new Date(y, m - 1, d, 12).getTime();
};

export const ExpenseFormModal = ({
	isOpen,
	onClose,
	onSubmit,
	people,
	currency = DEFAULT_CURRENCY,
	defaultPayerId,
	initialAmount = "",
	initialPaidBy = "",
	initialParticipants = new Set(),
	initialDescription = "",
	initialSplitMethod = "equally",
	initialPercentages = {},
	initialDate,
	title = "Add Expense",
}: ExpenseFormModalProps) => {
	const [amount, setAmount] = React.useState(initialAmount);
	const [paidBy, setPaidBy] = React.useState(initialPaidBy);
	const [participants, setParticipants] =
		React.useState<Set<string>>(initialParticipants);
	const [description, setDescription] = React.useState(initialDescription);
	const [splitMethod, setSplitMethod] =
		React.useState<SplitMethod>(initialSplitMethod);
	const [percentages, setPercentages] =
		React.useState<Record<string, number>>(initialPercentages);
	const [date, setDate] = React.useState(toDateInput(initialDate ?? Date.now()));
	const prevIsOpenRef = React.useRef(isOpen);
	const initialValuesRef = React.useRef({
		amount: initialAmount,
		paidBy: initialPaidBy,
		participants: initialParticipants,
		description: initialDescription,
		splitMethod: initialSplitMethod,
		percentages: initialPercentages,
		date: initialDate,
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
			participants: initialParticipants,
			description: initialDescription,
			splitMethod: initialSplitMethod,
			percentages: initialPercentages,
			date: initialDate,
			defaultPayerId,
		};
	}, [
		initialAmount,
		initialPaidBy,
		initialParticipantsArray,
		initialDescription,
		initialSplitMethod,
		initialPercentages,
		initialDate,
		defaultPayerId,
	]);

	const equalShares = (ids: Set<string>) => {
		const shares: Record<string, number> = {};
		if (ids.size === 0) return shares;
		const each = Math.round((100 / ids.size) * 100) / 100;
		const list = Array.from(ids);
		list.forEach((id) => {
			shares[id] = each;
		});
		// Put the rounding remainder on the last person so the total is exactly 100.
		shares[list[list.length - 1]] =
			Math.round((100 - each * (list.length - 1)) * 100) / 100;
		return shares;
	};

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
			// If no initial participants (new expense), select all members by default
			const defaultParticipants =
				init.participants.size > 0
					? new Set(init.participants)
					: new Set(people.map((p) => p.id));
			setParticipants(defaultParticipants);
			setDescription(init.description);
			setSplitMethod(init.splitMethod);
			setDate(toDateInput(init.date ?? Date.now()));
			if (
				init.splitMethod === "percentage" &&
				Object.keys(init.percentages).length === 0
			) {
				setPercentages(equalShares(defaultParticipants));
			} else {
				setPercentages({ ...init.percentages });
			}
		}
		prevIsOpenRef.current = isOpen;
	}, [isOpen, people]);

	const getTotalPercentage = () =>
		Array.from(participants).reduce((sum, id) => sum + (percentages[id] || 0), 0);

	const amountNum = parseFloat(amount);
	const hasAmount = amountNum > 0;
	const totalPct = getTotalPercentage();
	const pctOff = splitMethod === "percentage" && Math.abs(totalPct - 100) > 0.01;
	const canSubmit = hasAmount && !!paidBy && participants.size > 0 && !pctOff;
	const isEdit = title.includes("Edit");

	// The button says what's still missing instead of just going grey.
	const submitLabel = !hasAmount
		? "Enter an amount"
		: !paidBy
		? "Choose who paid"
		: participants.size === 0
		? "Choose who shared it"
		: pctOff
		? "Make it add up to 100%"
		: isEdit
		? "Save changes"
		: "Add expense";

	const handleSubmit = () => {
		if (!canSubmit) return;
		onSubmit(
			amountNum,
			paidBy,
			participants,
			description.trim() || undefined,
			splitMethod,
			splitMethod === "percentage" ? percentages : undefined,
			date ? fromDateInput(date) : undefined
		);
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
		if (splitMethod === "percentage") setPercentages(equalShares(next));
	};

	const setAllParticipants = (all: boolean) => {
		const next = all ? new Set(people.map((p) => p.id)) : new Set<string>();
		setParticipants(next);
		if (splitMethod === "percentage") setPercentages(equalShares(next));
	};

	const handlePercentageChange = (personId: string, value: number | undefined) => {
		const next = { ...percentages };
		if (value !== undefined && value >= 0 && value <= 100) {
			next[personId] = value;
		} else {
			delete next[personId];
		}
		setPercentages(next);
	};

	const shareOf = (id: string) =>
		!hasAmount
			? 0
			: splitMethod === "percentage"
			? (amountNum * (percentages[id] || 0)) / 100
			: participants.size > 0
			? amountNum / participants.size
			: 0;
	const allSelected = participants.size === people.length;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit expense" : "Add an expense"}>
			<form
				className="flex flex-col gap-5 pb-2"
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
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

				<fieldset>
					<legend className="mb-2 text-[13px] font-semibold text-ink-soft">
						Paid by
					</legend>
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
											? "bg-ink text-white"
											: "border border-line-strong bg-white text-ink-soft hover:border-ink-muted hover:text-ink"
									}`}
								>
									{person.name}
								</button>
							);
						})}
					</div>
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
							if (method === "percentage") setPercentages(equalShares(participants));
						}}
						data={[
							{ value: "equally", label: "Equally" },
							{ value: "percentage", label: "By percentage" },
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
													? "border-brand-700 bg-brand-700 text-white"
													: "border-line-strong bg-white"
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
									{selected && hasAmount && (
										<span className="shrink-0 text-sm tabular-nums text-ink-muted">
											{formatCurrency(Math.round(shareOf(person.id) * 100) / 100, currency)}
										</span>
									)}
									{selected && splitMethod === "percentage" && (
										<NumberInput
											aria-label={`${person.name}'s percentage`}
											value={percentages[person.id] ?? 0}
											onChange={(value) =>
												handlePercentageChange(
													person.id,
													value === "" ? undefined : parseFloat(value.toString())
												)
											}
											min={0}
											max={100}
											decimalScale={2}
											suffix="%"
											hideControls
											inputMode="decimal"
											size="sm"
											w={84}
											styles={{ input: { minHeight: 36, fontSize: 15, textAlign: "right" } }}
										/>
									)}
								</li>
							);
						})}
					</ul>

					{splitMethod === "percentage" && participants.size > 0 && (
						<p
							className={`mt-2 text-sm tabular-nums ${pctOff ? "text-negative" : "text-ink-muted"}`}
							role={pctOff ? "alert" : undefined}
						>
							Total {Math.round(totalPct * 100) / 100}%
							{pctOff &&
								` — ${Math.round(Math.abs(100 - totalPct) * 100) / 100}% ${
									totalPct < 100 ? "still to assign" : "too much"
								}`}
						</p>
					)}
				</fieldset>

				<div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-white px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
