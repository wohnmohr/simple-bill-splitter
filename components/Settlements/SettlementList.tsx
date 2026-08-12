"use client";

import { Settlement, Person, Currency, Expense } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { ArrowRight, Check } from "lucide-react";
import { ShareSettlementActions } from "@/components/Share/ShareSettlementActions";
import { UpiSettlementActions } from "@/components/Settlements/UpiSettlementActions";

interface SettlementListProps {
	settlements: Settlement[];
	people: Person[];
	currency: Currency;
	groupName?: string;
	expenses?: Expense[];
	/** Hide share controls (e.g. already on a shared view) */
	readOnly?: boolean;
	/** Allow adding/editing UPI IDs from settlement cards */
	onUpdateMemberUpi?: (personId: string, upiId: string) => void;
}

export const SettlementList = ({
	settlements,
	people,
	currency,
	groupName = "Split",
	expenses = [],
	readOnly = false,
	onUpdateMemberUpi,
}: SettlementListProps) => {
	const getPerson = (personId: string) => people.find((p) => p.id === personId);
	const getPersonName = (personId: string) =>
		getPerson(personId)?.name || "Unknown";

	const canShare = !readOnly && expenses.length > 0 && people.length > 0;
	const showUpi = currency.code === "INR";
	const missingUpiCount = showUpi
		? settlements.filter((s) => !getPerson(s.to)?.upiId?.trim()).length
		: 0;

	if (settlements.length === 0) {
		return (
			<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-indigo-100/80 p-6 sm:p-8 text-center space-y-4">
				<Check className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-green-500" />
				<div>
					<p className="text-base font-semibold text-gray-800">All settled up!</p>
					<p className="text-sm text-gray-500 mt-1">
						No payments needed — everyone is balanced.
					</p>
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
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-indigo-100/80 p-3.5 sm:p-5 space-y-4">
				<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="text-base font-bold text-gray-900">Who pays whom</h3>
						<p className="text-xs text-gray-500 mt-0.5">
							Fewest transfers to settle the group
							{showUpi ? " · Pay instantly with UPI" : ""}
						</p>
					</div>
					{canShare && (
						<div className="hidden sm:block">
							<ShareSettlementActions
								name={groupName}
								people={people}
								expenses={expenses}
								currency={currency}
								source="dashboard"
							/>
						</div>
					)}
				</div>

				{showUpi && missingUpiCount > 0 && onUpdateMemberUpi && (
					<p className="text-xs sm:text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
						{missingUpiCount} payment
						{missingUpiCount === 1 ? "" : "s"} missing a UPI ID — add below to
						enable one-tap Pay.
					</p>
				)}

				<div className="space-y-3">
					{settlements.map((settlement, index) => {
						const to = getPerson(settlement.to);
						const from = getPerson(settlement.from);

						return (
							<div
								key={index}
								className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-violet-50/60 p-3.5 sm:p-4 space-y-3"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-800">
											<span className="font-bold truncate max-w-[45%]">
												{getPersonName(settlement.from)}
											</span>
											<ArrowRight className="h-4 w-4 text-indigo-500 shrink-0" />
											<span className="font-bold truncate max-w-[45%]">
												{getPersonName(settlement.to)}
											</span>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											{getPersonName(settlement.from)} pays{" "}
											{getPersonName(settlement.to)}
										</p>
									</div>
									<p className="text-lg sm:text-xl font-bold shrink-0 text-indigo-700 tabular-nums">
										{formatCurrency(settlement.amount, currency)}
									</p>
								</div>

								{showUpi && (
									<UpiSettlementActions
										key={`${settlement.to}-${to?.upiId || "none"}`}
										settlement={settlement}
										from={from}
										to={to}
										currency={currency}
										groupName={groupName}
										onSaveUpi={readOnly ? undefined : onUpdateMemberUpi}
									/>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{canShare && (
				<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-indigo-100/80 p-3.5 sm:p-5">
					<p className="text-sm font-semibold text-gray-800 mb-3">
						Share with the group
					</p>
					<ShareSettlementActions
						name={groupName}
						people={people}
						expenses={expenses}
						currency={currency}
						primary
						source="dashboard"
					/>
				</div>
			)}
		</div>
	);
};
