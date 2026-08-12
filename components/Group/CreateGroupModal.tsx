import React from "react";
import { TextInput } from "@mantine/core";
import { Modal } from "@/components/UI/Modal";
import { Button } from "@/components/UI/Button";
import { Dropdown } from "@/components/UI/Dropdown";
import { MAX_GROUPS, CURRENCIES, DEFAULT_CURRENCY } from "@/constants";
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
	const [selectedCurrency, setSelectedCurrency] =
		React.useState<Currency>(DEFAULT_CURRENCY);

	const handleSubmit = () => {
		if (groupName.trim()) {
			onCreate(groupName, selectedCurrency);
			setGroupName("");
			setSelectedCurrency(DEFAULT_CURRENCY);
			onClose();
		}
	};

	const handleClose = () => {
		setGroupName("");
		setSelectedCurrency(DEFAULT_CURRENCY);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose}>
			<div className="p-4 sm:p-5">
				<h2 className="font-display text-xl font-bold text-gray-900 mb-1">
					Create a group
				</h2>
				<p className="text-sm text-gray-500 mb-4">
					Defaults to Indian Rupees (₹) — change anytime.
				</p>
				<div className="space-y-3 sm:space-y-4">
					<TextInput
						label="Group name"
						value={groupName}
						onChange={(e) => setGroupName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleSubmit();
							}
						}}
						placeholder="e.g. Goa trip, Flat 4B, Office lunch"
						autoFocus
						radius="md"
						styles={{
							input: {
								borderColor: "#c7d2fe",
								borderWidth: 2,
								minHeight: 44,
							},
						}}
					/>
					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-1.5">
							Currency
						</label>
						<Dropdown
							value={selectedCurrency.code}
							onChange={(code) => {
								const currency = CURRENCIES.find((c) => c.code === code);
								if (currency) setSelectedCurrency(currency);
							}}
							options={CURRENCIES.map((currency) => ({
								value: currency.code,
								label: `${currency.symbol} ${currency.name} (${currency.code})`,
							}))}
							placeholder="Select currency"
						/>
						{selectedCurrency.code === "INR" && (
							<p className="text-xs text-gray-500 mt-1.5">
								UPI pay links will be available on settlements.
							</p>
						)}
					</div>
					<div className="flex gap-2 sm:gap-3 pt-1">
						<Button
							variant="secondary"
							onClick={handleClose}
							className="flex-1 !min-h-11"
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleSubmit}
							disabled={!groupName.trim() || groupCount >= MAX_GROUPS}
							className="flex-1 !min-h-11"
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
