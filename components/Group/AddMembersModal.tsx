import React from "react";
import { TextInput, ActionIcon } from "@mantine/core";
import { Modal } from "@/components/UI/Modal";
import { Group, Person } from "@/types";

interface AddMembersModalProps {
	isOpen: boolean;
	onClose: () => void;
	group: Group;
	onAddMember: (name: string) => void;
	onDeleteMember: (personId: string) => void;
}

export const AddMembersModal = ({
	isOpen,
	onClose,
	group,
	onAddMember,
	onDeleteMember,
}: AddMembersModalProps) => {
	const [memberName, setMemberName] = React.useState("");

	const handleSubmit = () => {
		if (memberName.trim()) {
			onAddMember(memberName);
			setMemberName("");
		}
	};

	const handleClose = () => {
		setMemberName("");
		onClose();
	};

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

					{/* Add Member Form */}
					<div className="border-b border-gray-200 pb-3 sm:pb-4 mb-4 sm:mb-6">
						<label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
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
					</div>
				</div>

				{/* Members List - Scrollable */}
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
									className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-xl border border-gray-200"
								>
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
							))}
						</div>
					)}
				</div>
			</div>
		</Modal>
	);
};
