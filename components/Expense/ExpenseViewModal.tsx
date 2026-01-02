import { Expense, Person, Currency } from "@/types";
import { Modal } from "@/components/UI/Modal";
import { Button } from "@/components/UI/Button";
import { formatCurrency } from "@/utils/formatting";

interface ExpenseViewModalProps {
	isOpen: boolean;
	expense: Expense | null;
	people: Person[];
	currency: Currency;
	onClose: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

export const ExpenseViewModal = ({
	isOpen,
	expense,
	people,
	currency,
	onClose,
	onEdit,
	onDelete,
}: ExpenseViewModalProps) => {
	if (!expense) return null;

	const getPersonName = (personId: string) => {
		return people.find((p) => p.id === personId)?.name || "Unknown";
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<div className="p-4 sm:p-6 min-h-[85vh] sm:min-h-0 flex flex-col">
				<div className="flex justify-between items-center mb-4 sm:mb-6">
					<h2 className="text-lg sm:text-xl font-bold text-gray-800">
						Expense Details
					</h2>
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-gray-600 active:text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg text-xl touch-manipulation"
						aria-label="Close"
					></button>
				</div>
				<div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
					{expense.description && (
						<div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 bg-indigo-50 rounded-xl border border-indigo-200">
							<div className="text-xs sm:text-sm font-semibold text-gray-800 break-words">
								{expense.description}
							</div>
						</div>
					)}
					<div className="text-center">
						<div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent mb-2">
							{formatCurrency(expense.amount, currency)}
						</div>
						<div className="text-xs text-gray-500">Total amount</div>
					</div>
					<div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
						<div className="text-xs text-gray-500 mb-1 font-medium">
							Paid by
						</div>
						<div className="text-xs sm:text-sm font-bold text-gray-800">
							{getPersonName(expense.paidBy)}
						</div>
					</div>
					<div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
						<div className="text-xs text-gray-500 mb-1.5 sm:mb-2 font-medium">
							Split among
						</div>
						<div className="text-xs text-gray-800 font-semibold break-words">
							{expense.participants.map((id) => getPersonName(id)).join(", ")}
						</div>
					</div>
					{expense.splitMethod === "percentage" && expense.percentages ? (
						<div className="px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border-2 border-indigo-300">
							<div className="text-xs text-indigo-600 mb-2 text-center font-semibold">
								Split by Percentage
							</div>
							<div className="space-y-2">
								{expense.participants.map((participantId) => {
									const percentage = expense.percentages![participantId] || 0;
									const share = (expense.amount * percentage) / 100;
									return (
										<div
											key={participantId}
											className="flex justify-between items-center text-xs sm:text-sm"
										>
											<span className="text-gray-700 font-medium">
												{getPersonName(participantId)}
											</span>
											<span className="text-indigo-700 font-bold">
												{percentage.toFixed(2)}% ={" "}
												{formatCurrency(share, currency)}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					) : (
						<div className="px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border-2 border-indigo-300">
							<div className="text-xs text-indigo-600 mb-1 text-center font-semibold">
								Per person (Split Equally)
							</div>
							<div className="text-lg sm:text-xl font-extrabold text-indigo-700 text-center">
								{formatCurrency(
									expense.amount / expense.participants.length,
									currency
								)}
							</div>
						</div>
					)}
					<div className="flex gap-2 sm:gap-3 pt-2">
						<Button
							variant="primary"
							onClick={onEdit}
							className="flex-1 text-sm sm:text-base"
						>
							Edit
						</Button>
						<Button
							variant="danger"
							onClick={onDelete}
							className="text-sm sm:text-base"
						>
							Delete
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
};
