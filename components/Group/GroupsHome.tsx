import { Group } from "@/types";
import { MAX_GROUPS } from "@/constants";
import { getGroupColorTheme } from "@/utils/colorThemes";

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
				<div className="flex flex-col gap-2 sm:gap-3">
					{groups.map((group) => {
						const theme = getGroupColorTheme(group.id);
						return (
							<div
								key={group.id}
								className={`bg-gradient-to-r ${theme.gradient} rounded-xl shadow-lg border-2 ${theme.border} p-3 sm:p-4 hover:shadow-xl active:shadow-lg transition-all cursor-pointer touch-manipulation group`}
								onClick={() => onSelectGroup(group.id)}
							>
								<div className="flex items-center justify-between gap-3 sm:gap-4">
									<div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4">
										{/* Color accent bar */}
										<div
											className={`w-1.5 sm:w-2 h-12 sm:h-14 rounded-full bg-white/40 group-hover:bg-white/60 transition-colors shrink-0`}
										/>
										<div className="flex-1 min-w-0">
											<h3 className="text-base sm:text-lg font-bold text-white truncate drop-shadow-sm">
												{group.name}
											</h3>
											<div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/90 mt-1">
												<div className="flex items-center gap-1">
													<span className="font-semibold">
														{group.members.length}
													</span>
													<span>
														{group.members.length === 1 ? "member" : "members"}
													</span>
												</div>
												<div className="w-1 h-1 rounded-full bg-white/60" />
												<div className="flex items-center gap-1">
													<span className="font-semibold">
														{group.expenses.length}
													</span>
													<span>
														{group.expenses.length === 1
															? "expense"
															: "expenses"}
													</span>
												</div>
											</div>
										</div>
									</div>
									<button
										onClick={(e) => {
											e.stopPropagation();
											onDeleteGroup(group.id);
										}}
										className="text-white/90 hover:text-white active:text-white/80 text-xl font-bold px-2 shrink-0 touch-manipulation hover:bg-white/20 rounded-lg transition-colors"
										aria-label="Delete group"
									>
										×
									</button>
								</div>
							</div>
						);
					})}
					{groups.length < MAX_GROUPS && (
						<button
							onClick={onCreateGroup}
							className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-dashed border-indigo-300 p-3 sm:p-4 hover:bg-indigo-50 active:bg-indigo-100 transition-colors flex items-center justify-center gap-2 touch-manipulation"
						>
							<div className="text-xl sm:text-2xl text-indigo-600">+</div>
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
