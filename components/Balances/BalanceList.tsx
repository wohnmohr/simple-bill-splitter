import { Balance, Person, Currency } from "@/types";
import { formatCurrency } from "@/utils/formatting";

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
	const getPersonName = (personId: string) => {
		return people.find((p) => p.id === personId)?.name || "Unknown";
	};

	return (
		<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-3 sm:p-4">
			<div className="space-y-2">
				{balances.map((balance) => (
					<div
						key={balance.personId}
						className="flex justify-between items-center py-2.5 sm:py-3 px-2.5 sm:px-3 rounded-lg border-2 border-gray-200"
					>
						<span className="text-xs sm:text-sm font-medium text-gray-800 truncate flex-1 min-w-0 pr-2">
							{getPersonName(balance.personId)}
						</span>
						<span
							className={`font-bold text-xs sm:text-sm shrink-0 ${
								balance.balance > 0
									? "text-indigo-600"
									: balance.balance < 0
									? "text-red-600"
									: "text-gray-600"
							}`}
						>
							{balance.balance > 0
								? `+${formatCurrency(balance.balance, currency)}`
								: balance.balance < 0
								? `-${formatCurrency(Math.abs(balance.balance), currency)}`
								: formatCurrency(0, currency)}
						</span>
					</div>
				))}
			</div>
			<p className="text-xs text-gray-500 mt-3 sm:mt-4">
				<span className="text-indigo-600 font-semibold">+</span> = owed •{" "}
				<span className="text-red-600 font-semibold">-</span> = owes
			</p>
		</div>
	);
};
