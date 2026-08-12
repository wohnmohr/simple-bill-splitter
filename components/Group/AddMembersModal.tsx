import React from "react";
import { TextInput, ActionIcon } from "@mantine/core";
import { Modal } from "@/components/UI/Modal";
import { Group, Person } from "@/types";

interface AddMembersModalProps {
	isOpen: boolean;
	onClose: () => void;
	group: Group;
	onAddMember: (name: string, upiId?: string) => void;
	onUpdateMemberUpi?: (personId: string, upiId: string) => void;
	onDeleteMember: (personId: string) => void;
}

export const AddMembersModal = ({
	isOpen,
	onClose,
	group,
	onAddMember,
	onUpdateMemberUpi,
	onDeleteMember,
}: AddMembersModalProps) => {
	const [memberName, setMemberName] = React.useState("");
	const [memberUpi, setMemberUpi] = React.useState("");

	const handleSubmit = () => {
		if (memberName.trim()) {
			onAddMember(memberName, memberUpi || undefined);
			setMemberName("");
			setMemberUpi("");
		}
	};

	const handleClose = () => {
		setMemberName("");
		setMemberUpi("");
		onClose();
	};

	const showUpi = true; // India-first: always collect optional UPI IDs

	return (
		<Modal isOpen={isOpen} onClose={handleClose}>
			<div className="p-4 sm:p-6 h-[85vh] sm:h-auto sm:max-h-[80vh] flex flex-col overflow-hidden">
				<div className="flex-shrink-0">
					<h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
						Members of {group.name}
						<span className="ml-2 text-sm font-normal text-gray-500">
							({group.members.length})
						</span>
					</h2>

					<div className="border-b border-gray-200 pb-3 sm:pb-4 mb-4 sm:mb-6 space-y-2">
						<label className="block text-xs sm:text-sm font-semibold text-gray-700">
							Add New Member
						</label>
						<div className="flex gap-2">
							<TextInput
								value={memberName}
								onChange={(e) => setMemberName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleSubmit();
									}
								}}
								placeholder="Enter member name"
								className="flex-1"
								autoFocus
								radius="md"
								styles={{
									input: {
										borderColor: "#c7d2fe",
										borderWidth: 2,
									},
								}}
							/>
							<ActionIcon
								onClick={handleSubmit}
								disabled={!memberName.trim()}
								size="lg"
								radius="md"
								aria-label="Add member"
								style={{
									background: "linear-gradient(to right, #4f46e5, #9333ea)",
									color: "#ffffff",
								}}
							>
								+
							</ActionIcon>
						</div>
						{showUpi && (
							<>
								<TextInput
									value={memberUpi}
									onChange={(e) => setMemberUpi(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleSubmit();
										}
									}}
									placeholder="UPI ID (name@upi) — optional"
									radius="md"
									data-ph-mask
									styles={{
										input: {
											borderColor: "#c7d2fe",
											borderWidth: 2,
											minHeight: 44,
										},
									}}
								/>
								<p className="text-xs text-gray-500">
									Saved on this device and included in encrypted share links for
									one-tap Pay.
								</p>
							</>
						)}
					</div>
				</div>

				<div className="flex-1 overflow-y-auto min-h-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
					{group.members.length === 0 ? (
						<p className="text-xs sm:text-sm text-gray-500 text-center py-4">
							No members yet. Add at least one member to start tracking
							expenses.
						</p>
					) : (
						<div className="space-y-2">
							{group.members.map((member: Person) => (
								<div
									key={member.id}
									className="p-2.5 sm:p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2"
								>
									<div className="flex items-center justify-between gap-2">
										<span className="font-medium text-gray-800 text-sm sm:text-base truncate flex-1">
											{member.name}
										</span>
										<ActionIcon
											onClick={() => onDeleteMember(member.id)}
											color="red"
											variant="subtle"
											aria-label={`Delete ${member.name}`}
										>
											×
										</ActionIcon>
									</div>
									{showUpi && onUpdateMemberUpi && (
										<TextInput
											value={member.upiId || ""}
											onChange={(e) =>
												onUpdateMemberUpi(member.id, e.target.value)
											}
											placeholder="UPI ID (name@upi)"
											size="xs"
											radius="md"
											data-ph-mask
										/>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</Modal>
	);
};
