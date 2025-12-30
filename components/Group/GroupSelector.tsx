import { Group } from "@/types";
import { MAX_GROUPS } from "@/constants";

interface GroupSelectorProps {
	groups: Group[];
	selectedGroupId: string | null;
	onSelectGroup: (groupId: string) => void;
	onDeleteGroup: (groupId: string) => void;
	onCreateGroup: () => void;
}

export const GroupSelector = ({
	groups,
	selectedGroupId,
	onSelectGroup,
	onDeleteGroup,
	onCreateGroup,
}: GroupSelectorProps) => {
	if (groups.length === 0) return null;

	return (
		<div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
			{groups.map((group) => (
				<button
					key={group.id}
					onClick={() => onSelectGroup(group.id)}
					className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all touch-manipulation shrink-0 ${
						selectedGroupId === group.id
							? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
							: "bg-white text-gray-700 border-2 border-indigo-200 active:bg-indigo-50"
					}`}
				>
					<span className="truncate max-w-[120px] sm:max-w-none">
						{group.name}
					</span>
					<span
						onClick={(e) => {
							e.stopPropagation();
							onDeleteGroup(group.id);
						}}
						className="text-red-300 hover:text-white active:text-red-200 cursor-pointer shrink-0"
						role="button"
						tabIndex={0}
						aria-label="Delete group"
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								e.stopPropagation();
								onDeleteGroup(group.id);
							}
						}}
					>
						×
					</span>
				</button>
			))}
			{groups.length < MAX_GROUPS && (
				<button
					onClick={onCreateGroup}
					className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-medium text-xs sm:text-sm whitespace-nowrap hover:bg-indigo-50 active:bg-indigo-100 touch-manipulation shrink-0"
				>
					+ New Group
				</button>
			)}
		</div>
	);
};
