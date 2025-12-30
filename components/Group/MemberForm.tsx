import React from "react";
import { Group } from "@/types";

interface MemberFormProps {
	group: Group;
	onAddMember: (name: string) => void;
}

export const MemberForm = ({ group, onAddMember }: MemberFormProps) => {
	const [memberName, setMemberName] = React.useState("");

	const handleSubmit = () => {
		if (memberName.trim()) {
			onAddMember(memberName);
			setMemberName("");
		}
	};

	return (
		<div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
			<h2 className="text-xl font-bold text-gray-800 mb-4">
				Add Members to {group.name}
			</h2>
			<div className="flex gap-2 mb-4">
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
					className="flex-1 px-4 py-2 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
				/>
				<button
					onClick={handleSubmit}
					className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold"
				>
					Add
				</button>
			</div>
			{group.members.length === 0 && (
				<p className="text-sm text-gray-500 text-center">
					Add at least one member to start tracking expenses
				</p>
			)}
		</div>
	);
};
