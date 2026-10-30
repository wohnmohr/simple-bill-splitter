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
	/** For payments: "Recorded by you · 3:40 pm". */
	recorded?: string;
	/** The viewer's part of this expense, when they're in it. */
	myShare?: number;
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
	myShare,
	recorded,
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
					<span className="min-w-0 flex-1 text-sm text-ink-soft">
						<span className="block truncate">
							<span className="font-medium text-ink">{paidByName}</span> paid{" "}
							<span className="font-medium text-ink">{toName}</span>
						</span>
						{recorded && <span className="block text-xs text-ink-muted">{recorded}</span>}
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

	// Line two's right side: what the viewer pays, else the even split. Never wraps or truncates.
	const count = expense.participants.length;
	const share = myShare !== undefined
		? <><span className="text-ink-muted">Your share</span> {formatCurrency(myShare, currency)}</>
		: expense.splitMethod === "equally" && count > 1
		? `${formatCurrency(expense.amount / count, currency)} each`
		: null;

	return (
		<li className="group flex items-center transition-colors hover:bg-paper">
			<button
				type="button"
				onClick={onClick}
				className="min-w-0 flex-1 space-y-0.5 px-4 py-3.5 text-left"
			>
				<span className="flex items-baseline gap-3">
					<span
						className={`min-w-0 flex-1 truncate font-semibold ${
							expense.description ? "text-ink" : "text-ink-muted"
						}`}
					>
						{expense.description || "Untitled expense"}
					</span>
					<span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-ink">
						{formatCurrency(expense.amount, currency)}
					</span>
				</span>
				<span className="flex items-center gap-3 text-sm text-ink-muted">
					<span className="flex min-w-0 flex-1 items-center gap-1.5">
						{/* Comments lead the line: a question on a bill is what people open it for. */}
						{commentCount > 0 && (
							<span
								className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-brand-700"
								aria-label={`${commentCount} comments`}
							>
								<MessageCircle className="h-3.5 w-3.5" aria-hidden />
								{commentCount}
							</span>
						)}
						{expense.repeat && (
							<Repeat className="h-3.5 w-3.5 shrink-0 text-brand-700" aria-label="Monthly" />
						)}
						<span className="truncate">
							{paidByName} paid
							{expense.createdAt && <> · {shortDate(expense.createdAt)}</>}
						</span>
					</span>
					{share && <span className="shrink-0 whitespace-nowrap tabular-nums text-ink-soft">{share}</span>}
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
