import { Expense, ExpenseComment, Person, Currency } from "@/types";
import { ChevronDown } from "lucide-react";
import { ExpenseCard } from "./ExpenseCard";
import { expensePayers, expenseShares, minorUnits } from "@/utils/calculations";
import { joinNames, recordedNote } from "@/utils/formatting";

interface ExpenseListProps {
	expenses: Expense[];
	comments?: ExpenseComment[];
	people: Person[];
	currency: Currency;
	/** Who is viewing: each expense they're in shows their share. */
	meId?: string | null;
	onExpenseClick: (expenseId: string) => void;
	onExpenseEdit: (expense: Expense) => void;
	onExpenseDelete: (expenseId: string) => void;
	onAddExpense?: () => void;
}

export const ExpenseList = ({
	expenses,
	comments = [],
	people,
	currency,
	meId,
	onExpenseClick,
	onExpenseEdit,
	onExpenseDelete,
	onAddExpense,
}: ExpenseListProps) => {
	const getPersonName = (personId: string) => {
		return people.find((p) => p.id === personId)?.name || "Unknown";
	};

	// Payments ("A paid B") aren't bills, so they sit apart under a folded "Payments" row.
	const bills = expenses.filter((e) => e.kind !== "payment");
	const payments = expenses.filter((e) => e.kind === "payment");

	if (expenses.length === 0) {
		return (
			<div className="surface px-6 py-10 text-center">
				<p className="font-semibold text-ink">No expenses yet</p>
				<p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">
					Tap <span className="font-medium text-ink-soft">Add expense</span> to log
					the first bill. Balances update as you go.
				</p>
			</div>
		);
	}

	const commentCounts = new Map<string, number>();
	for (const c of comments) commentCounts.set(c.expenseId, (commentCounts.get(c.expenseId) ?? 0) + 1);

	// Newest first: the most recent bill is the one people look for.
	const renderRows = (list: Expense[]) =>
		[...list].reverse().map((expense) => (
			<ExpenseCard
				key={expense.id}
				expense={expense}
				currency={currency}
				paidByName={joinNames([...expensePayers(expense).keys()].map(getPersonName))}
				toName={getPersonName(expense.participants[0])}
				recorded={expense.kind === "payment" ? recordedNote(expense, meId, getPersonName) : undefined}
				myShare={meId ? expenseShares(expense, minorUnits(currency)).get(meId) : undefined}
				commentCount={commentCounts.get(expense.id)}
				onClick={() => onExpenseClick(expense.id)}
				onEdit={(e) => {
					e.stopPropagation();
					onExpenseEdit(expense);
				}}
				onDelete={(e) => {
					e.stopPropagation();
					onExpenseDelete(expense.id);
				}}
			/>
		));

	return (
		<div className="space-y-3">
			{bills.length > 0 && <ul className="surface divide-y divide-line overflow-hidden">{renderRows(bills)}</ul>}
			{payments.length > 0 && (
				<details className="surface group/payments overflow-hidden">
					<summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
						<span className="flex-1 font-medium text-ink">Payments</span>
						<span className="tabular-nums text-ink-muted">{payments.length}</span>
						<ChevronDown
							className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open/payments:rotate-180"
							aria-hidden
						/>
					</summary>
					<ul className="divide-y divide-line border-t border-line">{renderRows(payments)}</ul>
				</details>
			)}
		</div>
	);
};
