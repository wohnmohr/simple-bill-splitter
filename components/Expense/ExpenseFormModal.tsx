import React from "react";
import { Modal } from "@/components/UI/Modal";
import { Button } from "@/components/UI/Button";
import { Dropdown } from "@/components/UI/Dropdown";
import { Person } from "@/types";

interface ExpenseFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (
		amount: number,
		paidBy: string,
		participants: Set<string>,
		description?: string
	) => void;
	people: Person[];
	initialAmount?: string;
	initialPaidBy?: string;
	initialParticipants?: Set<string>;
	initialDescription?: string;
	title?: string;
}

export const ExpenseFormModal = ({
	isOpen,
	onClose,
	onSubmit,
	people,
	initialAmount = "",
	initialPaidBy = "",
	initialParticipants = new Set(),
	initialDescription = "",
	title = "Add Expense",
}: ExpenseFormModalProps) => {
	const [amount, setAmount] = React.useState(initialAmount);
	const [paidBy, setPaidBy] = React.useState(initialPaidBy);
	const [participants, setParticipants] =
		React.useState<Set<string>>(initialParticipants);
	const [description, setDescription] = React.useState(initialDescription);
	const prevIsOpenRef = React.useRef(isOpen);
	const initialValuesRef = React.useRef({
		amount: initialAmount,
		paidBy: initialPaidBy,
		participants: initialParticipants,
		description: initialDescription,
	});

	// Convert Set to sorted array for stable comparison
	const initialParticipantsArray = React.useMemo(
		() => Array.from(initialParticipants).sort().join(","),
		[initialParticipants]
	);

	// Update refs with latest initial values
	React.useEffect(() => {
		initialValuesRef.current = {
			amount: initialAmount,
			paidBy: initialPaidBy,
			participants: initialParticipants,
			description: initialDescription,
		};
	}, [
		initialAmount,
		initialPaidBy,
		initialParticipantsArray,
		initialDescription,
	]);

	// Only reset form when modal opens (transitions from closed to open)
	React.useEffect(() => {
		if (isOpen && !prevIsOpenRef.current) {
			const {
				amount: initAmount,
				paidBy: initPaidBy,
				participants: initParticipants,
				description: initDescription,
			} = initialValuesRef.current;
			setAmount(initAmount);
			setPaidBy(initPaidBy);
			setParticipants(new Set(initParticipants));
			setDescription(initDescription);
		}
		prevIsOpenRef.current = isOpen;
	}, [isOpen]);

	const handleSubmit = () => {
		const amountNum = parseFloat(amount);
		if (amountNum > 0 && paidBy && participants.size > 0) {
			onSubmit(
				amountNum,
				paidBy,
				participants,
				description.trim() || undefined
			);
			setAmount("");
			setPaidBy("");
			setParticipants(new Set());
			setDescription("");
			onClose();
		}
	};

	const handleClose = () => {
		setAmount("");
		setPaidBy("");
		setParticipants(new Set());
		setDescription("");
		onClose();
	};

	const toggleParticipant = (personId: string) => {
		const newSet = new Set(participants);
		if (newSet.has(personId)) {
			newSet.delete(personId);
		} else {
			newSet.add(personId);
		}
		setParticipants(newSet);
	};

	const handlePaidByChange = (personId: string) => {
		setPaidBy(personId);
		if (personId) {
			const newSet = new Set(participants);
			newSet.add(personId);
			setParticipants(newSet);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose}>
			<div className="p-4 sm:p-6">
				<h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
					{title}
				</h2>
				<div className="space-y-3 sm:space-y-4">
					<div>
						<label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
							Description
						</label>
						<input
							type="text"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="e.g., Dinner at restaurant"
							className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
						/>
					</div>
					<div>
						<label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
							Amount
						</label>
						<input
							type="number"
							step="0.01"
							min="0"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="0.00"
							className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
						/>
					</div>
					<div>
						<label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
							Paid By
						</label>
						<Dropdown
							value={paidBy}
							onChange={handlePaidByChange}
							options={[
								{ value: "", label: "Select person" },
								...people.map((person) => ({
									value: person.id,
									label: person.name,
								})),
							]}
							placeholder="Select person"
						/>
					</div>
					<div>
						<label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
							Participants
						</label>
						<div className="flex flex-wrap gap-1.5 sm:gap-2">
							{people.map((person) => (
								<label
									key={person.id}
									className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer px-2 sm:px-3 py-1.5 sm:py-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 touch-manipulation"
								>
									<input
										type="checkbox"
										checked={participants.has(person.id)}
										onChange={() => toggleParticipant(person.id)}
										className="w-4 h-4 text-indigo-600 border-2 border-indigo-300 rounded focus:ring-indigo-500 shrink-0"
									/>
									<span className="text-xs text-gray-700 font-medium">
										{person.name}
									</span>
								</label>
							))}
						</div>
					</div>
					<div className="flex gap-2 sm:gap-3 pt-2">
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
							disabled={!amount || !paidBy || participants.size === 0}
							className="flex-1"
						>
							{title.includes("Edit") ? "Save" : "Add"}
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
};
