import { useState } from "react";
import { Expense, ExpenseComment, Person, Currency } from "@/types";
import { Modal } from "@/components/UI/Modal";
import { Button } from "@/components/UI/Button";
import { formatCurrency, joinNames } from "@/utils/formatting";
import { expensePayers, expenseShares, minorUnits, splitChoice } from "@/utils/calculations";
import { MAX_COMMENT } from "@/utils/groupOps";
import { ArrowUp, Pencil, Trash2 } from "lucide-react";

interface ExpenseViewModalProps {
	isOpen: boolean;
	expense: Expense | null;
	people: Person[];
	currency: Currency;
	/** Comments on this expense, oldest first. */
	comments: ExpenseComment[];
	/** Who is using this device, to show their comments as "You". */
	meId?: string | null;
	onClose: () => void;
	onEdit: () => void;
	onDelete: () => void;
	onComment: (text: string) => void;
}

const commentTime = (ms: number) =>
	new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const ExpenseViewModal = ({
	isOpen,
	expense,
	people,
	currency,
	comments,
	meId,
	onClose,
	onEdit,
	onDelete,
	onComment,
}: ExpenseViewModalProps) => {
	const [draft, setDraft] = useState("");
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
	const byShares = splitChoice(expense) === "shares";
	const unit = minorUnits(currency);
	const shares = expenseShares(expense, unit);
	const payers = expensePayers(expense, unit);
	const splitLabel = isPercentage ? "by percentage" : byShares ? "by shares" : expense.splitMethod === "exact" ? "by exact amounts" : "equally";

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
							{joinNames([...payers.keys()].map(getPersonName))}
						</span>{" "}
						· split {splitLabel}
					</p>
				</div>

				{payers.size > 1 && (
					<div>
						<p className="label-text mb-2">Who paid</p>
						<ul className="divide-y divide-line rounded-xl border border-line">
							{[...payers].map(([id, paid]) => (
								<li key={id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
									<span className="truncate text-ink">{getPersonName(id)}</span>
									<span className="shrink-0 font-semibold tabular-nums text-ink">{formatCurrency(paid, currency)}</span>
								</li>
							))}
						</ul>
					</div>
				)}

				<div>
					<p className="label-text mb-2">Each person&apos;s share</p>
					<ul className="divide-y divide-line rounded-xl border border-line">
						{expense.participants.map((id) => (
							<li key={id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
								<span className="truncate text-ink">{getPersonName(id)}</span>
								<span className="shrink-0 tabular-nums">
									{byShares && (
										<span className="mr-2 text-sm text-ink-muted">{expense.shares![id]}×</span>
									)}
									{isPercentage && (
										<span className="mr-2 text-sm text-ink-muted">
											{(expense.percentages![id] || 0).toFixed(
												Number.isInteger(expense.percentages![id] || 0) ? 0 : 2
											)}
											%
										</span>
									)}
									<span className="font-semibold text-ink">
										{formatCurrency(shares.get(id) ?? 0, currency)}
									</span>
								</span>
							</li>
						))}
					</ul>
				</div>

				<section aria-label="Comments">
					<p className="label-text mb-2">Comments</p>
					{comments.length > 0 && (
						<ul className="mb-2 flex flex-col gap-2">
							{comments.map((c) => (
								<li key={c.id} className="rounded-xl bg-paper px-3.5 py-2.5">
									<p className="text-xs text-ink-muted">
										<span className="font-medium text-ink-soft">
											{c.by === meId && meId ? "You" : c.by ? getPersonName(c.by) : "Someone"}
										</span>{" "}
										· {commentTime(c.at)}
									</p>
									<p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink">{c.text}</p>
								</li>
							))}
						</ul>
					)}
					<form
						className="flex items-center gap-2"
						onSubmit={(e) => {
							e.preventDefault();
							if (!draft.trim()) return;
							onComment(draft);
							setDraft("");
						}}
					>
						<input
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							maxLength={MAX_COMMENT}
							placeholder={comments.length ? "Reply…" : "Ask about it or add a note…"}
							aria-label="Add a comment"
							className="min-h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-4 text-sm text-ink placeholder:text-ink-muted focus:border-brand-700 focus:outline-none"
						/>
						<button
							type="submit"
							disabled={!draft.trim()}
							aria-label="Send comment"
							className="btn-primary !h-11 !w-11 shrink-0 !rounded-full !p-0"
						>
							<ArrowUp className="h-4 w-4" />
						</button>
					</form>
				</section>

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
