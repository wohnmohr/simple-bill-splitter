"use client";

import { Settlement, Person, Currency, Expense } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { ArrowRight, Check } from "lucide-react";
import { ShareSettlementActions } from "@/components/Share/ShareSettlementActions";

interface SettlementListProps {
	settlements: Settlement[];
	people: Person[];
	currency: Currency;
	groupName?: string;
	expenses?: Expense[];
	/** Hide share controls (e.g. already on a shared view) */
	readOnly?: boolean;
}

export const SettlementList = ({
	settlements,
	people,
	currency,
	groupName = "Split",
	expenses = [],
	readOnly = false,
}: SettlementListProps) => {
	const getPersonName = (personId: string) => {
		return people.find((p) => p.id === personId)?.name || "Unknown";
	};

	const canShare = !readOnly && expenses.length > 0 && people.length > 0;

	if (settlements.length === 0) {
		return (
			<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-6 sm:p-8 text-center space-y-4">
				<Check className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
				<p className="text-sm sm:text-base font-semibold text-gray-700">
					All settled up!
				</p>
				<p className="text-xs sm:text-sm text-gray-500 mt-1">
					No payments needed — everyone is balanced.
				</p>
				{canShare && (
					<ShareSettlementActions
						name={groupName}
						people={people}
						expenses={expenses}
						currency={currency}
						primary
						source="dashboard"
					/>
				)}
			</div>
		);
	}

	return (
		<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-3 sm:p-4 space-y-4">
			<div className="flex items-center justify-between gap-2">
				<h3 className="text-sm sm:text-base font-bold text-gray-800">
					Who pays whom
				</h3>
				{canShare && (
					<ShareSettlementActions
						name={groupName}
						people={people}
						expenses={expenses}
						currency={currency}
						source="dashboard"
					/>
				)}
			</div>

			<div className="space-y-2">
				{settlements.map((settlement, index) => (
					<div
						key={index}
						className="border-2 border-indigo-200 rounded-xl p-2.5 sm:p-3 bg-gradient-to-r from-indigo-50 to-purple-50"
					>
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-1.5 sm:gap-2 min-w-0 text-xs sm:text-sm text-gray-700">
								<span className="font-bold truncate max-w-[35%]">
									{getPersonName(settlement.from)}
								</span>
								<ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500 shrink-0" />
								<span className="font-bold truncate max-w-[35%]">
									{getPersonName(settlement.to)}
								</span>
							</div>
							<span className="text-sm sm:text-base font-bold shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
								{formatCurrency(settlement.amount, currency)}
							</span>
						</div>
					</div>
				))}
			</div>

			{canShare && (
				<ShareSettlementActions
					name={groupName}
					people={people}
					expenses={expenses}
					currency={currency}
					primary
				/>
			)}

			<p className="text-xs text-gray-500">
				Simplified to the fewest possible payments.
			</p>
		</div>
	);
};
