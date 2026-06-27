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
				{balances.map((balance) => {
					const isOwed = balance.balance > 0;
					const owes = balance.balance < 0;
					const statusLabel = isOwed
						? "gets back"
						: owes
						? "owes"
						: "settled up";
					return (
						<div
							key={balance.personId}
							className="flex justify-between items-center gap-2 py-2.5 sm:py-3 px-2.5 sm:px-3 rounded-lg border-2 border-gray-200"
						>
							<span className="text-xs sm:text-sm font-medium text-gray-800 truncate flex-1 min-w-0">
								{getPersonName(balance.personId)}
							</span>
							<div className="flex flex-col items-end shrink-0">
								<span
									className={`text-[10px] sm:text-xs font-medium ${
										isOwed
											? "text-indigo-500"
											: owes
											? "text-red-500"
											: "text-gray-400"
									}`}
								>
									{statusLabel}
								</span>
								<span
									className={`font-bold text-xs sm:text-sm ${
										isOwed
											? "text-indigo-600"
											: owes
											? "text-red-600"
											: "text-gray-600"
									}`}
								>
									{formatCurrency(Math.abs(balance.balance), currency)}
								</span>
							</div>
						</div>
					);
				})}
			</div>
			<p className="text-xs text-gray-500 mt-3 sm:mt-4">
				<span className="text-indigo-600 font-semibold">Gets back</span> = others
				owe them •{" "}
				<span className="text-red-600 font-semibold">Owes</span> = they owe others
			</p>
		</div>
	);
};
