import { Expense, Person, Currency } from "@/types";
import { ExpenseCard } from "./ExpenseCard";

interface ExpenseListProps {
	expenses: Expense[];
	people: Person[];
	currency: Currency;
	onExpenseClick: (expenseId: string) => void;
	onExpenseEdit: (expense: Expense) => void;
	onExpenseDelete: (expenseId: string) => void;
	onAddExpense?: () => void;
}

export const ExpenseList = ({
	expenses,
	people,
	currency,
	onExpenseClick,
	onExpenseEdit,
	onExpenseDelete,
	onAddExpense,
}: ExpenseListProps) => {
	const getPersonName = (personId: string) => {
		return people.find((p) => p.id === personId)?.name || "Unknown";
	};

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

	// Newest first: the most recent bill is the one people look for.
	const ordered = [...expenses].reverse();

	return (
		<ul className="surface divide-y divide-line overflow-hidden">
			{ordered.map((expense) => (
				<ExpenseCard
					key={expense.id}
					expense={expense}
					currency={currency}
					paidByName={getPersonName(expense.paidBy)}
					toName={getPersonName(expense.participants[0])}
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
			))}
		</ul>
	);
};
