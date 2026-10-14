import { Balance, Person, Currency } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { MemberAvatar } from "@/components/Group/MemberAvatar";

interface BalanceListProps {
	balances: Balance[];
	people: Person[];
	currency: Currency;
}

export const BalanceList = ({
	balances,
	people,
	currency,
}: BalanceListProps) => {
	const getPerson = (personId: string): Person => people.find((p) => p.id === personId) ?? { id: personId, name: "Unknown" };

	// Largest creditors first, then debtors, so the list reads top-down.
	const ordered = [...balances].sort((a, b) => b.balance - a.balance);
	const maxAbs = Math.max(1, ...ordered.map((b) => Math.abs(b.balance)));

	return (
		<div className="surface overflow-hidden">
			<ul className="divide-y divide-line">
				{ordered.map((balance) => {
					const isOwed = balance.balance > 0.004;
					const owes = balance.balance < -0.004;
					const width = `${(Math.abs(balance.balance) / maxAbs) * 100}%`;
					return (
						<li key={balance.personId} className="flex items-center gap-3 px-4 py-3.5">
							<MemberAvatar person={getPerson(balance.personId)} size="sm" />
							<div className="min-w-0 flex-1">
							<div className="flex items-baseline justify-between gap-3">
								<span className="min-w-0 truncate font-semibold text-ink">
									{getPerson(balance.personId).name}
								</span>
								<span className="shrink-0 text-right">
									<span
										className={`font-semibold tabular-nums ${
											isOwed ? "text-positive" : owes ? "text-negative" : "text-ink-muted"
										}`}
									>
										{isOwed ? "+" : owes ? "−" : ""}
										{formatCurrency(Math.abs(balance.balance), currency)}
									</span>
									<span className="ml-2 text-sm text-ink-muted">
										{isOwed ? "gets back" : owes ? "owes" : "settled"}
									</span>
								</span>
							</div>
							<div className="mt-2 h-1 rounded-full bg-ink/[0.05]" aria-hidden>
								<div
									className={`h-1 rounded-full ${
										isOwed ? "bg-positive/70" : owes ? "bg-negative/70" : ""
									}`}
									style={{ width: isOwed || owes ? width : 0 }}
								/>
							</div>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
};
