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
	const atLimit = groupCount >= MAX_GROUPS;

	const handleSubmit = () => {
		if (groupName.trim() && !atLimit) {
			onCreate(groupName.trim(), selectedCurrency);
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
		<Modal isOpen={isOpen} onClose={handleClose} title="New group">
			<form
				className="flex flex-col gap-4 pb-2"
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<TextInput
					label="Group name"
					value={groupName}
					onChange={(e) => setGroupName(e.target.value)}
					placeholder="Goa trip, Flat 4B, Office lunch"
					data-autofocus
					maxLength={60}
				/>
				<div>
					<Dropdown
						label="Currency"
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
					<p className="mt-1.5 text-sm text-ink-muted">
						{selectedCurrency.code === "INR"
							? "Settlements will include one-tap UPI pay links."
							: "UPI pay links are only available for rupee groups."}
					</p>
				</div>
				{atLimit && (
					<p className="text-sm text-negative" role="alert">
						You already have {MAX_GROUPS} groups. Delete one to create another.
					</p>
				)}
				<div className="flex gap-2 pt-1">
					<Button variant="secondary" type="button" onClick={handleClose} className="flex-1">
						Cancel
					</Button>
					<Button
						variant="primary"
						type="submit"
						disabled={!groupName.trim() || atLimit}
						className="flex-[2]"
					>
						Create group
					</Button>
				</div>
			</form>
		</Modal>
	);
};
