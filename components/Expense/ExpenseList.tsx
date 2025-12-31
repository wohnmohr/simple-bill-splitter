import { Wallet } from "lucide-react";
import { Expense, Person, Currency } from "@/types";
import { ExpenseCard } from "./ExpenseCard";

interface ExpenseListProps {
	expenses: Expense[];
	people: Person[];
	currency: Currency;
	onExpenseClick: (expenseId: string) => void;
	onExpenseEdit: (expense: Expense) => void;
	onExpenseDelete: (expenseId: string) => void;
}

export const ExpenseList = ({
	expenses,
	people,
	currency,
	onExpenseClick,
	onExpenseEdit,
	onExpenseDelete,
}: ExpenseListProps) => {
	const getPersonName = (personId: string) => {
		return people.find((p) => p.id === personId)?.name || "Unknown";
	};

	if (expenses.length === 0) {
		return (
			<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-6 sm:p-8 text-center">
				<Wallet className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-2 text-indigo-500" />
				<p className="text-xs sm:text-sm text-gray-500 px-2">
					No expenses yet. Tap the + button to add one!
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{expenses.map((expense) => (
				<ExpenseCard
					key={expense.id}
					expense={expense}
					currency={currency}
					paidByName={getPersonName(expense.paidBy)}
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
		</div>
	);
};
