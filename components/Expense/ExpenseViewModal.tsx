import { Expense, Person, Currency } from "@/types";
import { Modal } from "@/components/UI/Modal";
import { Button } from "@/components/UI/Button";
import { formatCurrency } from "@/utils/formatting";
import { Pencil, Trash2 } from "lucide-react";

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

	if (expense.kind === "payment") {
		return (
			<Modal isOpen={isOpen} onClose={onClose} title="Payment">
				<div className="flex flex-col gap-5 pb-2">
					<div>
						<p className="text-3xl font-semibold tabular-nums text-ink">
							{formatCurrency(expense.amount, currency)}
						</p>
						<p className="mt-1 text-sm text-ink-muted">
							<span className="font-medium text-ink-soft">
								{getPersonName(expense.paidBy)}
							</span>{" "}
							paid{" "}
							<span className="font-medium text-ink-soft">
								{getPersonName(expense.participants[0])}
							</span>
							{expense.createdAt &&
								` · ${new Date(expense.createdAt).toLocaleDateString("en-IN", {
									day: "numeric",
									month: "short",
								})}`}
						</p>
					</div>
					<p className="text-sm text-ink-muted">
						Recorded in SplitBiller as settled. Delete it if the money didn&apos;t
						actually move.
					</p>
					<Button
						variant="danger"
						onClick={onDelete}
						leftSection={<Trash2 className="h-4 w-4" />}
					>
						Delete payment
					</Button>
				</div>
			</Modal>
		);
	}

	const isPercentage = expense.splitMethod === "percentage" && !!expense.percentages;
	const shareOf = (id: string) =>
		isPercentage
			? (expense.amount * (expense.percentages![id] || 0)) / 100
			: expense.amount / expense.participants.length;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={expense.description || "Expense"}>
			<div className="flex flex-col gap-5 pb-2">
				<div>
					<p className="text-3xl font-semibold tabular-nums text-ink">
						{formatCurrency(expense.amount, currency)}
					</p>
					<p className="mt-1 text-sm text-ink-muted">
						Paid by{" "}
						<span className="font-medium text-ink-soft">
							{getPersonName(expense.paidBy)}
						</span>{" "}
						· split {isPercentage ? "by percentage" : "equally"}
					</p>
				</div>

				<div>
					<p className="label-text mb-2">Each person&apos;s share</p>
					<ul className="divide-y divide-line rounded-xl border border-line">
						{expense.participants.map((id) => (
							<li key={id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
								<span className="truncate text-ink">{getPersonName(id)}</span>
								<span className="shrink-0 tabular-nums">
									{isPercentage && (
										<span className="mr-2 text-sm text-ink-muted">
											{(expense.percentages![id] || 0).toFixed(
												Number.isInteger(expense.percentages![id] || 0) ? 0 : 2
											)}
											%
										</span>
									)}
									<span className="font-semibold text-ink">
										{formatCurrency(shareOf(id), currency)}
									</span>
								</span>
							</li>
						))}
					</ul>
				</div>

				<div className="flex gap-2 pt-1">
					<Button
						variant="danger"
						onClick={onDelete}
						leftSection={<Trash2 className="h-4 w-4" />}
					>
						Delete
					</Button>
					<Button
						variant="primary"
						onClick={onEdit}
						className="flex-1"
						leftSection={<Pencil className="h-4 w-4" />}
					>
						Edit
					</Button>
				</div>
			</div>
		</Modal>
	);
};
