import { Expense, Currency } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { Check, Pencil, Trash2 } from "lucide-react";

const shortDate = (ms: number) =>
	new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

interface ExpenseCardProps {
	expense: Expense;
	currency: Currency;
	paidByName: string;
	/** For payments: who received the money. */
	toName?: string;
	onClick: () => void;
	onEdit: (e: React.MouseEvent) => void;
	onDelete: (e: React.MouseEvent) => void;
}

export const ExpenseCard = ({
	expense,
	currency,
	paidByName,
	toName,
	onClick,
	onEdit,
	onDelete,
}: ExpenseCardProps) => {
	if (expense.kind === "payment") {
		return (
			<li className="group relative">
				<button
					type="button"
					onClick={onClick}
					className="flex w-full items-center gap-3 bg-paper/60 px-4 py-3 text-left transition-colors hover:bg-paper"
				>
					<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-positive-soft">
						<Check className="h-3.5 w-3.5 text-positive" strokeWidth={3} aria-hidden />
					</span>
					<span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
						<span className="font-medium text-ink">{paidByName}</span> paid{" "}
						<span className="font-medium text-ink">{toName}</span>
					</span>
					<span className="shrink-0 text-sm font-medium tabular-nums text-ink-soft sm:mr-12">
						{formatCurrency(expense.amount, currency)}
					</span>
				</button>
				<div className="absolute right-2 top-1/2 hidden -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:flex">
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
	const isPercentage = expense.splitMethod === "percentage";
	const splitLabel = isPercentage
		? `Split by % among ${count}`
		: count === 1
		? "1 person"
		: `${formatCurrency(expense.amount / count, currency)} each · ${count} people`;

	return (
		<li className="group relative">
			<button
				type="button"
				onClick={onClick}
				className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper"
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
						<span className="text-ink-soft">{paidByName}</span> paid · {splitLabel}
					</span>
				</span>
				<span className="shrink-0 text-right sm:mr-20">
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
			<div className="absolute right-2 top-1/2 hidden -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:flex">
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
