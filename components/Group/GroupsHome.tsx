import { Group } from "@/types";
import { MAX_GROUPS } from "@/constants";

interface GroupsHomeProps {
	groups: Group[];
	onSelectGroup: (groupId: string) => void;
	onDeleteGroup: (groupId: string) => void;
	onCreateGroup: () => void;
}

export const GroupsHome = ({
	groups,
	onSelectGroup,
	onDeleteGroup,
	onCreateGroup,
}: GroupsHomeProps) => {
	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="text-center mb-6 sm:mb-8">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
					Your Groups
				</h1>
				<p className="text-sm sm:text-base text-gray-600 px-2">
					Select a group to view expenses or create a new one
				</p>
			</div>

			{groups.length === 0 ? (
				<div className="text-center py-8 sm:py-12">
					<p className="text-sm sm:text-base text-gray-500 mb-4 px-2">
						No groups yet. Create your first group to get started!
					</p>
					<button
						onClick={onCreateGroup}
						className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 shadow-lg text-sm sm:text-base touch-manipulation"
					>
						Create Your First Group
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
					{groups.map((group) => (
						<div
							key={group.id}
							className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-4 sm:p-6 hover:shadow-xl active:shadow-lg transition-shadow cursor-pointer touch-manipulation"
							onClick={() => onSelectGroup(group.id)}
						>
							<div className="flex items-start justify-between mb-3 sm:mb-4">
								<div className="flex-1 min-w-0">
									<h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 truncate">
										{group.name}
									</h3>
									<div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
										<span className="font-semibold">
											{group.currency.symbol}
										</span>
										<span>{group.currency.code}</span>
									</div>
								</div>
								<button
									onClick={(e) => {
										e.stopPropagation();
										onDeleteGroup(group.id);
									}}
									className="text-red-500 hover:text-red-700 active:text-red-800 text-xl font-bold px-2 shrink-0 touch-manipulation"
									aria-label="Delete group"
								>
									×
								</button>
							</div>
							<div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
								<div>
									<span className="font-semibold">{group.members.length}</span>{" "}
									{group.members.length === 1 ? "member" : "members"}
								</div>
								<div>
									<span className="font-semibold">{group.expenses.length}</span>{" "}
									{group.expenses.length === 1 ? "expense" : "expenses"}
								</div>
							</div>
						</div>
					))}
					{groups.length < MAX_GROUPS && (
						<button
							onClick={onCreateGroup}
							className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border-2 border-dashed border-indigo-300 p-4 sm:p-6 hover:bg-indigo-50 active:bg-indigo-100 transition-colors flex flex-col items-center justify-center min-h-[120px] sm:min-h-[150px] touch-manipulation"
						>
							<div className="text-3xl sm:text-4xl text-indigo-600 mb-2">+</div>
							<div className="text-sm sm:text-base text-indigo-600 font-semibold">
								New Group
							</div>
						</button>
					)}
				</div>
			)}
		</div>
	);
};
