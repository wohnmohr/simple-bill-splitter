import { Expense } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { Currency } from "@/types";

interface ExpenseCardProps {
	expense: Expense;
	currency: Currency;
	paidByName: string;
	onClick: () => void;
	onEdit: (e: React.MouseEvent) => void;
	onDelete: (e: React.MouseEvent) => void;
}

export const ExpenseCard = ({
	expense,
	currency,
	paidByName,
	onClick,
	onEdit,
	onDelete,
}: ExpenseCardProps) => {
	return (
		<div
			className="group relative bg-white rounded-xl shadow-md hover:shadow-xl cursor-pointer transition-all overflow-hidden border border-gray-100"
			onClick={onClick}
		>
			<div className="flex items-center justify-between p-3 sm:p-4">
				<div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
					<div className="text-lg sm:text-xl font-extrabold bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent shrink-0">
						{formatCurrency(expense.amount, currency)}
					</div>
					<div className="flex flex-col min-w-0 flex-1">
						{expense.description ? (
							<div className="text-xs sm:text-sm font-semibold text-gray-800 truncate mb-1">
								{expense.description}
							</div>
						) : null}
						<div className="text-xs sm:text-sm font-medium text-gray-700 truncate">
							Paid by {paidByName}
						</div>
						<div className="flex items-center gap-1 text-xs text-gray-500">
							<span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
							{expense.participants.length}{" "}
							{expense.participants.length === 1
								? "participant"
								: "participants"}
						</div>
					</div>
				</div>
				<div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
					<button
						onClick={onEdit}
						className="p-1.5 sm:p-2 bg-white/90 text-indigo-600 hover:text-indigo-700 active:bg-indigo-100 rounded-lg shadow-sm text-sm touch-manipulation"
						aria-label="Edit expense"
					>
						✎
					</button>
					<button
						onClick={onDelete}
						className="p-1.5 sm:p-2 bg-white/90 text-red-600 hover:text-red-700 active:bg-red-100 rounded-lg shadow-sm text-sm font-bold touch-manipulation"
						aria-label="Delete expense"
					>
						×
					</button>
				</div>
			</div>
		</div>
	);
};
