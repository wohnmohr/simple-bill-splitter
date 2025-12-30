import { Settlement, Person, Currency } from "@/types";
import { formatCurrency } from "@/utils/formatting";

interface SettlementListProps {
	settlements: Settlement[];
	people: Person[];
	currency: Currency;
}

export const SettlementList = ({
	settlements,
	people,
	currency,
}: SettlementListProps) => {
	const getPersonName = (personId: string) => {
		return people.find((p) => p.id === personId)?.name || "Unknown";
	};

	if (settlements.length === 0) {
		return (
			<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-3 sm:p-4">
				<p className="text-xs sm:text-sm text-gray-500 text-center py-4">
					No settlements needed. Everyone is balanced!
				</p>
				<p className="text-xs text-gray-500 mt-3 sm:mt-4">Min transactions</p>
			</div>
		);
	}

	return (
		<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-3 sm:p-4">
			<div className="space-y-2">
				{settlements.map((settlement, index) => (
					<div
						key={index}
						className="border-2 border-indigo-200 rounded-xl p-2.5 sm:p-3 bg-gradient-to-r from-indigo-50 to-purple-50"
					>
						<div className="flex flex-col gap-1">
							<span className="text-xs text-gray-700 break-words">
								<span className="font-bold">
									{getPersonName(settlement.from)}
								</span>{" "}
								owes{" "}
								<span className="font-bold">
									{getPersonName(settlement.to)}
								</span>
							</span>
							<span className="text-sm sm:text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
								{formatCurrency(settlement.amount, currency)}
							</span>
						</div>
					</div>
				))}
			</div>
			<p className="text-xs text-gray-500 mt-3 sm:mt-4">Min transactions</p>
		</div>
	);
};
