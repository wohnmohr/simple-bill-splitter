"use client";

import { Settlement, Person, Currency, Expense } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { buildUpiLink } from "@/utils/upi";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { ShareSettlementActions } from "@/components/Share/ShareSettlementActions";
import { track } from "@/lib/analytics";

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
	const getPerson = (personId: string) => people.find((p) => p.id === personId);
	const getPersonName = (personId: string) =>
		getPerson(personId)?.name || "Unknown";

	const canShare = !readOnly && expenses.length > 0 && people.length > 0;
	const showUpi = currency.code === "INR";

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
				{settlements.map((settlement, index) => {
					const to = getPerson(settlement.to);
					const from = getPerson(settlement.from);
					const upiLink =
						showUpi && to?.upiId
							? buildUpiLink({
									pa: to.upiId,
									pn: to.name,
									am: settlement.amount,
									tn: `${groupName} — ${from?.name || "split"}`,
								})
							: null;

					return (
						<div
							key={index}
							className="border-2 border-indigo-200 rounded-xl p-2.5 sm:p-3 bg-gradient-to-r from-indigo-50 to-purple-50 space-y-2"
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
							{showUpi && to?.upiId && (
								<p className="text-[11px] sm:text-xs text-gray-500 truncate">
									UPI: {to.upiId}
								</p>
							)}
							{upiLink && (
								<a
									href={upiLink}
									onClick={() => track("upi_pay_link_clicked")}
									className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-700 hover:text-indigo-900"
								>
									Pay via UPI
									<ExternalLink className="h-3.5 w-3.5" />
								</a>
							)}
						</div>
					);
				})}
			</div>

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

			<p className="text-xs text-gray-500">
				Simplified to the fewest possible payments.
				{showUpi
					? " Add UPI IDs on members to enable Pay links in shares."
					: ""}
			</p>
		</div>
	);
};
