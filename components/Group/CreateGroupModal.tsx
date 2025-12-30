import React from "react";
import { Modal } from "@/components/UI/Modal";
import { Button } from "@/components/UI/Button";
import { MAX_GROUPS, CURRENCIES } from "@/constants";
import { Currency } from "@/types";

interface CreateGroupModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (name: string, currency: Currency) => void;
	groupCount: number;
}

export const CreateGroupModal = ({
	isOpen,
	onClose,
	onCreate,
	groupCount,
}: CreateGroupModalProps) => {
	const [groupName, setGroupName] = React.useState("");
	const [selectedCurrency, setSelectedCurrency] = React.useState<Currency>(
		CURRENCIES[0]
	);

	const handleSubmit = () => {
		if (groupName.trim()) {
			onCreate(groupName, selectedCurrency);
			setGroupName("");
			setSelectedCurrency(CURRENCIES[0]);
			onClose();
		}
	};

	const handleClose = () => {
		setGroupName("");
		setSelectedCurrency(CURRENCIES[0]);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose}>
			<div className="p-4 sm:p-6">
				<h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
					Create New Group
				</h2>
				<div className="space-y-3 sm:space-y-4">
					<div>
						<label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
							Group Name
						</label>
						<input
							type="text"
							value={groupName}
							onChange={(e) => setGroupName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleSubmit();
								}
							}}
							placeholder="e.g., Weekend Trip"
							className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
							autoFocus
						/>
					</div>
					<div>
						<label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
							Currency
						</label>
						<select
							value={selectedCurrency.code}
							onChange={(e) => {
								const currency = CURRENCIES.find(
									(c) => c.code === e.target.value
								);
								if (currency) setSelectedCurrency(currency);
							}}
							className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base touch-manipulation"
						>
							{CURRENCIES.map((currency) => (
								<option key={currency.code} value={currency.code}>
									{currency.symbol} {currency.name} ({currency.code})
								</option>
							))}
						</select>
					</div>
					<div className="flex gap-2 sm:gap-3">
						<Button
							variant="secondary"
							onClick={handleClose}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleSubmit}
							disabled={!groupName.trim() || groupCount >= MAX_GROUPS}
							className="flex-1"
						>
							Create
						</Button>
					</div>
					{groupCount >= MAX_GROUPS && (
						<p className="text-xs text-red-500 text-center">
							Maximum {MAX_GROUPS} groups allowed
						</p>
					)}
				</div>
			</div>
		</Modal>
	);
};
