import { Expense, Currency } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { Check, MessageCircle, Pencil, Repeat, Trash2 } from "lucide-react";

/**
 * Edit and delete slide in at the end of a row on hover or keyboard focus,
 * instead of reserving an empty gap beside every amount. Touch screens open
 * the expense to edit it.
 */
const ROW_ACTIONS =
	"hidden sm:flex w-0 shrink-0 items-center justify-end gap-0.5 overflow-hidden pr-2 opacity-0 transition-[width,opacity] duration-150 group-hover:opacity-100 group-focus-within:opacity-100";

const shortDate = (ms: number) =>
	new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

interface ExpenseCardProps {
	expense: Expense;
	currency: Currency;
	paidByName: string;
	/** For payments: who received the money. */
	toName?: string;
	commentCount?: number;
	onClick: () => void;
	onEdit: (e: React.MouseEvent) => void;
	onDelete: (e: React.MouseEvent) => void;
}

export const ExpenseCard = ({
	expense,
	currency,
	paidByName,
	toName,
	commentCount = 0,
	onClick,
	onEdit,
	onDelete,
}: ExpenseCardProps) => {
	if (expense.kind === "payment") {
		return (
			<li className="group flex items-center bg-paper/60 transition-colors hover:bg-paper">
				<button
					type="button"
					onClick={onClick}
					className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
				>
					<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-positive-soft">
						<Check className="h-3.5 w-3.5 text-positive" strokeWidth={3} aria-hidden />
					</span>
					<span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
						<span className="font-medium text-ink">{paidByName}</span> paid{" "}
						<span className="font-medium text-ink">{toName}</span>
					</span>
					<span className="shrink-0 text-sm font-medium tabular-nums text-ink-soft">
						{formatCurrency(expense.amount, currency)}
					</span>
				</button>
				<div className={`${ROW_ACTIONS} group-hover:w-11 group-focus-within:w-11`}>
					<button
						onClick={onDelete}
						className="icon-btn hover:!text-negative"
						aria-label="Delete payment"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			</li>
		);
	}

	const count = expense.participants.length;
	const splitLabel = expense.splitMethod === "percentage"
		? `Split by % among ${count}`
		: expense.splitMethod === "exact"
		? `Split by amount among ${count}`
		: count === 1
		? "1 person"
		: `${formatCurrency(expense.amount / count, currency)} each · ${count} people`;

	return (
		<li className="group flex items-center transition-colors hover:bg-paper">
			<button
				type="button"
				onClick={onClick}
				className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left"
			>
				<span className="min-w-0 flex-1">
					<span
						className={`block truncate font-semibold ${
							expense.description ? "text-ink" : "text-ink-muted"
						}`}
					>
						{expense.description || "Untitled expense"}
					</span>
					<span className="mt-0.5 block truncate text-sm text-ink-muted">
						{expense.repeat && (
							<>
								<Repeat className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-brand-700" aria-hidden />
								<span className="text-brand-700">Monthly</span> ·{" "}
							</>
						)}
						<span className="text-ink-soft">{paidByName}</span> paid · {splitLabel}
						{commentCount > 0 && (
							<>
								{" "}·{" "}
								<MessageCircle className="inline h-3.5 w-3.5 align-[-2px]" aria-label="Comments" /> {commentCount}
							</>
						)}
					</span>
				</span>
				<span className="shrink-0 text-right">
					<span className="block font-semibold tabular-nums text-ink">
						{formatCurrency(expense.amount, currency)}
					</span>
					{expense.createdAt && (
						<span className="mt-0.5 block text-xs text-ink-muted">
							{shortDate(expense.createdAt)}
						</span>
					)}
				</span>
			</button>
			<div className={`${ROW_ACTIONS} group-hover:w-20 group-focus-within:w-20`}>
				<button onClick={onEdit} className="icon-btn" aria-label="Edit expense">
					<Pencil className="h-4 w-4" />
				</button>
				<button
					onClick={onDelete}
					className="icon-btn hover:!text-negative"
					aria-label="Delete expense"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>
		</li>
	);
};
