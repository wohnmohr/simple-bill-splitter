import React from "react";
import { TextInput } from "@mantine/core";
import { Button } from "@/components/UI/Button";
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
					radius="md"
					styles={{
						input: {
							borderColor: "#c7d2fe",
							borderWidth: 2,
						},
					}}
				/>
				<Button onClick={handleSubmit} variant="primary">
					Add
				</Button>
			</div>
			{group.members.length === 0 && (
				<p className="text-sm text-gray-500 text-center">
					Add at least one member to start tracking expenses
				</p>
			)}
		</div>
	);
};
