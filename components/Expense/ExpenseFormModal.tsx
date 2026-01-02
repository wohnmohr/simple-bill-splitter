import React from "react";
import { TextInput, NumberInput, Checkbox, Stack } from "@mantine/core";
import { Modal } from "@/components/UI/Modal";
import { Button } from "@/components/UI/Button";
import { Dropdown } from "@/components/UI/Dropdown";
import { Person, SplitMethod } from "@/types";

interface ExpenseFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (
		amount: number,
		paidBy: string,
		participants: Set<string>,
		description?: string,
		splitMethod?: SplitMethod,
		percentages?: Record<string, number>
	) => void;
	people: Person[];
	initialAmount?: string;
	initialPaidBy?: string;
	initialParticipants?: Set<string>;
	initialDescription?: string;
	initialSplitMethod?: SplitMethod;
	initialPercentages?: Record<string, number>;
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
	initialSplitMethod = "equally",
	initialPercentages = {},
	title = "Add Expense",
}: ExpenseFormModalProps) => {
	const [amount, setAmount] = React.useState(initialAmount);
	const [paidBy, setPaidBy] = React.useState(initialPaidBy);
	const [participants, setParticipants] =
		React.useState<Set<string>>(initialParticipants);
	const [description, setDescription] = React.useState(initialDescription);
	const [splitMethod, setSplitMethod] =
		React.useState<SplitMethod>(initialSplitMethod);
	const [percentages, setPercentages] =
		React.useState<Record<string, number>>(initialPercentages);
	const prevIsOpenRef = React.useRef(isOpen);
	const initialValuesRef = React.useRef({
		amount: initialAmount,
		paidBy: initialPaidBy,
		participants: initialParticipants,
		description: initialDescription,
		splitMethod: initialSplitMethod,
		percentages: initialPercentages,
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
			splitMethod: initialSplitMethod,
			percentages: initialPercentages,
		};
	}, [
		initialAmount,
		initialPaidBy,
		initialParticipantsArray,
		initialDescription,
		initialSplitMethod,
		initialPercentages,
	]);

	// Only reset form when modal opens (transitions from closed to open)
	React.useEffect(() => {
		if (isOpen && !prevIsOpenRef.current) {
			const {
				amount: initAmount,
				paidBy: initPaidBy,
				participants: initParticipants,
				description: initDescription,
				splitMethod: initSplitMethod,
				percentages: initPercentages,
			} = initialValuesRef.current;
			setAmount(initAmount);
			setPaidBy(initPaidBy);
			// If no initial participants (new expense), select all members by default
			const defaultParticipants =
				initParticipants.size > 0
					? new Set(initParticipants)
					: new Set(people.map((p) => p.id));
			setParticipants(defaultParticipants);
			setDescription(initDescription);
			setSplitMethod(initSplitMethod);
			// If percentage mode and no initial percentages, distribute equally
			if (
				initSplitMethod === "percentage" &&
				Object.keys(initPercentages).length === 0
			) {
				const participantsToUse = defaultParticipants;
				if (participantsToUse.size > 0) {
					const equalPercentage = 100 / participantsToUse.size;
					const newPercentages: Record<string, number> = {};
					participantsToUse.forEach((id) => {
						newPercentages[id] = equalPercentage;
					});
					setPercentages(newPercentages);
				} else {
					setPercentages({ ...initPercentages });
				}
			} else {
				setPercentages({ ...initPercentages });
			}
		}
		prevIsOpenRef.current = isOpen;
	}, [isOpen, people]);

	const handleSubmit = () => {
		const amountNum = parseFloat(amount);
		if (amountNum > 0 && paidBy && participants.size > 0) {
			// Validate percentages if split method is percentage
			if (splitMethod === "percentage") {
				const totalPercentage = Array.from(participants).reduce((sum, id) => {
					return sum + (percentages[id] || 0);
				}, 0);
				if (Math.abs(totalPercentage - 100) > 0.01) {
					// Percentages don't sum to 100
					return;
				}
			}

			onSubmit(
				amountNum,
				paidBy,
				participants,
				description.trim() || undefined,
				splitMethod,
				splitMethod === "percentage" ? percentages : undefined
			);
			setAmount("");
			setPaidBy("");
			setParticipants(new Set());
			setDescription("");
			setSplitMethod("equally");
			setPercentages({});
			onClose();
		}
	};

	const handleClose = () => {
		setAmount("");
		setPaidBy("");
		setParticipants(new Set());
		setDescription("");
		setSplitMethod("equally");
		setPercentages({});
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
		// Don't auto-add to participants - let user control selection
	};

	const handlePercentageChange = (
		personId: string,
		value: number | undefined
	) => {
		const newPercentages = { ...percentages };
		if (value !== undefined && value >= 0 && value <= 100) {
			newPercentages[personId] = value;
		} else {
			delete newPercentages[personId];
		}
		setPercentages(newPercentages);
	};

	const getTotalPercentage = () => {
		return Array.from(participants).reduce((sum, id) => {
			return sum + (percentages[id] || 0);
		}, 0);
	};

	const distributeEqually = () => {
		if (participants.size > 0) {
			const equalPercentage = 100 / participants.size;
			const newPercentages: Record<string, number> = {};
			participants.forEach((id) => {
				newPercentages[id] = equalPercentage;
			});
			setPercentages(newPercentages);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose}>
			<div className="pt-12 pb-4 px-4 sm:pt-6 sm:p-6 min-h-[85vh] sm:min-h-0 flex flex-col">
				<h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">
					{title}
				</h2>
				<Stack gap="md" className="flex-1 overflow-y-auto">
					<TextInput
						label="Description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="e.g., Dinner at restaurant"
						radius="md"
						styles={{
							input: {
								borderColor: "#c7d2fe",
								borderWidth: 2,
							},
						}}
					/>
					<NumberInput
						label="Amount"
						value={amount ? parseFloat(amount) : undefined}
						onChange={(value) => setAmount(value?.toString() || "")}
						placeholder="0.00"
						min={0}
						step={0.01}
						decimalSeparator="."
						thousandSeparator=","
						radius="md"
						styles={{
							input: {
								borderColor: "#c7d2fe",
								borderWidth: 2,
							},
						}}
					/>
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
							Split Method
						</label>
						<Dropdown
							value={splitMethod}
							onChange={(value) => {
								setSplitMethod(value as SplitMethod);
								if (value === "equally") {
									distributeEqually();
								}
							}}
							options={[
								{ value: "equally", label: "Split Equally" },
								{ value: "percentage", label: "Split by Percentage" },
							]}
							placeholder="Select split method"
						/>
					</div>
					<div>
						<label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
							Participants
						</label>
						<Stack gap="xs">
							{people.map((person) => (
								<div key={person.id} className="flex flex-col gap-1">
									<Checkbox
										label={person.name}
										checked={participants.has(person.id)}
										onChange={() => {
											toggleParticipant(person.id);
											// Remove percentage when deselected
											if (participants.has(person.id)) {
												const newPercentages = { ...percentages };
												delete newPercentages[person.id];
												setPercentages(newPercentages);
											} else if (splitMethod === "percentage") {
												// Auto-distribute when adding participant
												distributeEqually();
											}
										}}
										color="indigo"
									/>
									{splitMethod === "percentage" &&
										participants.has(person.id) && (
											<div className="ml-6">
												<NumberInput
													value={percentages[person.id] || 0}
													onChange={(value) =>
														handlePercentageChange(
															person.id,
															value ? parseFloat(value.toString()) : undefined
														)
													}
													placeholder="0"
													min={0}
													max={100}
													step={0.01}
													decimalSeparator="."
													suffix="%"
													radius="md"
													size="xs"
													styles={{
														input: {
															borderColor: "#c7d2fe",
															borderWidth: 2,
														},
													}}
												/>
											</div>
										)}
								</div>
							))}
						</Stack>
						{splitMethod === "percentage" && participants.size > 0 && (
							<div className="mt-2 text-xs text-gray-600">
								Total: {getTotalPercentage().toFixed(2)}%
								{Math.abs(getTotalPercentage() - 100) > 0.01 && (
									<span className="text-red-600 ml-2">(Should be 100%)</span>
								)}
							</div>
						)}
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
							disabled={
								!amount ||
								!paidBy ||
								participants.size === 0 ||
								(splitMethod === "percentage" &&
									Math.abs(getTotalPercentage() - 100) > 0.01)
							}
							className="flex-1"
						>
							{title.includes("Edit") ? "Save" : "Add"}
						</Button>
					</div>
				</Stack>
			</div>
		</Modal>
	);
};
