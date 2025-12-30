import { Tab } from "@/types";

interface TabNavigationProps {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}

export const TabNavigation = ({
	activeTab,
	onTabChange,
}: TabNavigationProps) => {
	const tabs: { id: Tab; label: string; icon: string }[] = [
		{ id: "transactions", label: "Transactions", icon: "📝" },
		{ id: "balances", label: "Balances", icon: "⚖️" },
		{ id: "settlements", label: "Settlements", icon: "💸" },
	];

	return (
		<div className="mb-4 sm:mb-6">
			<div className="flex gap-1 sm:gap-2 border-b-2 border-gray-200 overflow-x-auto">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={`relative flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
							activeTab === tab.id
								? "text-indigo-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						<span className="text-sm sm:text-base">{tab.icon}</span>
						<span className="hidden min-[375px]:inline">{tab.label}</span>
						{activeTab === tab.id && (
							<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></span>
						)}
					</button>
				))}
			</div>
		</div>
	);
};
