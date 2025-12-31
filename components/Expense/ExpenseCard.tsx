import { Expense } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { Currency } from "@/types";
import { Receipt, User, Users, Pencil, Trash2 } from "lucide-react";

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
	const perPersonAmount = expense.amount / expense.participants.length;

	return (
		<div
			className="group relative bg-white rounded-xl shadow-md hover:shadow-xl cursor-pointer transition-all overflow-hidden border border-gray-100"
			onClick={onClick}
		>
			<div className="p-3 sm:p-4">
				{/* Header: Description or default */}
				{expense.description ? (
					<div className="flex items-center gap-2 mb-2 sm:mb-3">
						<Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500 shrink-0" />
						<div className="text-sm sm:text-base font-semibold text-gray-800 truncate flex-1">
							{expense.description}
						</div>
					</div>
				) : (
					<div className="flex items-center gap-2 mb-2 sm:mb-3">
						<Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 shrink-0" />
						<div className="text-sm sm:text-base font-medium text-gray-500 italic">
							No description
						</div>
					</div>
				)}

				{/* Main content area */}
				<div className="flex items-start justify-between gap-3 sm:gap-4">
					<div className="flex-1 min-w-0">
						{/* Total amount */}
						<div className="mb-2 sm:mb-3">
							<div className="text-xl sm:text-2xl font-extrabold bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
								{formatCurrency(expense.amount, currency)}
							</div>
							<div className="text-xs text-gray-500 mt-0.5">Total</div>
						</div>

						{/* Per person amount - key info */}
						<div className="mb-2 sm:mb-3 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
							<div className="flex items-center gap-1.5">
								<div className="text-xs sm:text-sm font-semibold text-indigo-700">
									{formatCurrency(perPersonAmount, currency)}
								</div>
								<div className="text-xs text-indigo-600">per person</div>
							</div>
						</div>

						{/* Details row */}
						<div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs sm:text-sm">
							<div className="flex items-center gap-1.5 text-gray-700">
								<User className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
								<span className="truncate">
									<span className="text-gray-500">Paid by </span>
									<span className="font-semibold">{paidByName}</span>
								</span>
							</div>
							<div className="flex items-center gap-1.5 text-gray-700">
								<Users className="h-3.5 w-3.5 text-purple-500 shrink-0" />
								<span>
									<span className="font-semibold">
										{expense.participants.length}
									</span>
									<span className="text-gray-500">
										{" "}
										{expense.participants.length === 1 ? "person" : "people"}
									</span>
								</span>
							</div>
						</div>
					</div>

					{/* Action buttons */}
					<div className="flex flex-col gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
						<button
							onClick={onEdit}
							className="p-2 sm:p-2.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-600 hover:text-indigo-700 rounded-lg shadow-sm transition-colors touch-manipulation"
							aria-label="Edit expense"
						>
							<Pencil className="h-4 w-4 sm:h-5 sm:w-5" />
						</button>
						<button
							onClick={onDelete}
							className="p-2 sm:p-2.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 hover:text-red-700 rounded-lg shadow-sm transition-colors touch-manipulation"
							aria-label="Delete expense"
						>
							<Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
