import { Group } from "@/types";

interface GroupSelectorProps {
	groups: Group[];
	selectedGroupId: string | null;
	onSelectGroup: (groupId: string) => void;
	onDeleteGroup: (groupId: string) => void;
}

export const GroupSelector = ({
	groups,
	selectedGroupId,
	onSelectGroup,
	onDeleteGroup,
}: GroupSelectorProps) => {
	if (groups.length === 0) return null;

	const selectedGroup = groups.find((g) => g.id === selectedGroupId);

	return (
		<div className="mb-4 sm:mb-6">
			{selectedGroup && (
				<div className="mb-3 sm:mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-4 sm:p-6 text-white">
					<div className="flex items-center justify-between">
						<div className="flex-1 min-w-0">
							<h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate mb-1">
								{selectedGroup.name}
							</h1>
							<p className="text-indigo-100 text-sm sm:text-base">
								{selectedGroup.currency.symbol} {selectedGroup.currency.name}
							</p>
						</div>
						<button
							onClick={() => onDeleteGroup(selectedGroup.id)}
							className="ml-4 p-2 hover:bg-white/20 active:bg-white/30 rounded-full transition-colors shrink-0"
							aria-label="Delete group"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5 sm:h-6 sm:w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>
				</div>
			)}

			{groups.length > 1 && (
				<div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
					{groups.map((group) => (
						<button
							key={group.id}
							onClick={() => onSelectGroup(group.id)}
							className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap transition-all touch-manipulation shrink-0 ${
								selectedGroupId === group.id
									? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
									: "bg-white text-gray-700 border-2 border-indigo-200 active:bg-indigo-50"
							}`}
						>
							<span className="truncate max-w-[120px] sm:max-w-none">
								{group.name}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};
