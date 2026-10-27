import { useState, type ReactNode } from "react";
import { NumberInput, TextInput } from "@mantine/core";
import { DEFAULT_CURRENCY } from "@/constants";
import { formatCurrency } from "@/utils/formatting";
import { MAX_AMOUNT } from "@/utils/groupOps";
import { splitNames, type FirstExpenseInput } from "@/utils/firstExpense";
import { pasteNames } from "@/components/UI/pasteNames";
import { PasteLink } from "@/components/Group/PasteLink";
import { loadMyName } from "@/utils/myName";

interface EmptyGroupStateProps {
	/** Saves the first expense; the group is made around it. */
	onFirstExpense: (expense: FirstExpenseInput) => void;
	/** An empty group, for setting up a trip before anyone has paid. */
	onCreateGroup: () => void;
	/** Start the group by typing an expense. */
	quickAdd: ReactNode;
}

/**
 * The first run is the first expense: amount, what for, who. The group comes
 * with it, so nobody has to name and set up a group before splitting anything.
 */
export const EmptyGroupState = ({ onFirstExpense, onCreateGroup, quickAdd }: EmptyGroupStateProps) => {
	// Kept as typed: Mantine hands over in-between text like "0." as a string, and dropping it wipes the field.
	const [amount, setAmount] = useState<number | string>("");
	const [description, setDescription] = useState("");
	const [myName, setMyName] = useState(loadMyName);
	const [othersText, setOthersText] = useState("");
	const [typing, setTyping] = useState(false);

	const others = splitNames(othersText, [myName]);
	const total = Number(amount) || 0;
	const ready = total > 0 && total <= MAX_AMOUNT && !!myName.trim() && others.length > 0;

	return (
		<section className="surface mx-auto max-w-lg p-6 sm:p-8">
			<h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">Split your first bill</h1>
			<p className="mt-2 text-ink-soft">No signup. Nothing leaves this phone until you share it.</p>

			<form
				className="mt-5 flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					if (ready) onFirstExpense({ amount: total, description: description.trim(), myName: myName.trim(), others });
				}}
			>
				<NumberInput
					label="Amount"
					value={amount}
					onChange={setAmount}
					placeholder="0"
					min={0}
					max={MAX_AMOUNT}
					clampBehavior="strict"
					decimalScale={2}
					thousandSeparator=","
					thousandsGroupStyle="lakh"
					hideControls
					inputMode="decimal"
					size="lg"
					leftSection={<span className="text-2xl font-semibold text-ink-muted" aria-hidden>{DEFAULT_CURRENCY.symbol}</span>}
					leftSectionWidth={44}
					classNames={{ input: "!text-2xl !font-semibold !tabular-nums" }}
				/>
				<TextInput
					label="What for"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Dinner, Goa trip, rent"
					maxLength={60}
				/>
				<div className="grid grid-cols-2 gap-3">
					<TextInput
						label="Paid by (you)"
						value={myName}
						onChange={(e) => setMyName(e.target.value)}
						placeholder="Your name"
						autoComplete="given-name"
						maxLength={40}
					/>
					<TextInput
						label="Split with"
						value={othersText}
						onChange={(e) => setOthersText(e.target.value)}
						onPaste={(e) => pasteNames(e, setOthersText)}
						placeholder="Riya, Kabir"
						autoCapitalize="words"
					/>
				</div>
				<button type="submit" disabled={!ready} className="btn-primary w-full !py-3 !text-base">
					{ready
						? `Split ${formatCurrency(total, DEFAULT_CURRENCY)} · ${formatCurrency(total / (others.length + 1), DEFAULT_CURRENCY)} each`
						: "Split it"}
				</button>
			</form>

			<div className="mt-6 border-t border-line pt-5">
				{typing ? (
					quickAdd
				) : (
					<button type="button" onClick={() => setTyping(true)} className="font-medium text-brand-700 hover:underline">
						Or type it like a message
					</button>
				)}
				<p className="mt-3 text-sm text-ink-muted">
					Planning ahead?{" "}
					<button type="button" onClick={onCreateGroup} className="font-medium text-brand-700 hover:underline">
						Create an empty group
					</button>
					.
				</p>
				<div className="mt-3 text-sm">
					<PasteLink label="Had groups in another browser or phone? Paste the link" />
				</div>
			</div>
		</section>
	);
};
