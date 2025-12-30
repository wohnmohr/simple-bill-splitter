import React from "react";
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
			<div className="p-4 sm:p-6">
				<h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
					Members of {group.name}
				</h2>

				{/* Members List */}
				<div className="mb-4 sm:mb-6">
					{group.members.length === 0 ? (
						<p className="text-xs sm:text-sm text-gray-500 text-center py-4">
							No members yet. Add at least one member to start tracking
							expenses.
						</p>
					) : (
						<div className="space-y-2 max-h-64 overflow-y-auto">
							{group.members.map((member: Person) => (
								<div
									key={member.id}
									className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-xl border border-gray-200"
								>
									<span className="font-medium text-gray-800 text-sm sm:text-base truncate flex-1">
										{member.name}
									</span>
									<button
										onClick={() => onDeleteMember(member.id)}
										className="text-red-500 hover:text-red-700 active:text-red-800 text-lg font-bold px-2 shrink-0 touch-manipulation"
										aria-label={`Delete ${member.name}`}
									>
										×
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Add Member Form */}
				<div className="border-t border-gray-200 pt-3 sm:pt-4">
					<label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
						Add New Member
					</label>
					<div className="flex gap-2">
						<input
							type="text"
							value={memberName}
							onChange={(e) => setMemberName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleSubmit();
								}
							}}
							placeholder="Enter member name"
							className="flex-1 px-3 sm:px-4 py-2 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
							autoFocus
						/>
						<button
							onClick={handleSubmit}
							disabled={!memberName.trim()}
							className="px-4 sm:px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
						>
							Add
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
};
