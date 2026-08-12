import { Tab } from "@/types";
import { Receipt, Scale, ArrowRightLeft, LucideIcon } from "lucide-react";

interface TabNavigationProps {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}

export const TabNavigation = ({
	activeTab,
	onTabChange,
}: TabNavigationProps) => {
	const tabs: { id: Tab; label: string; shortLabel: string; icon: LucideIcon }[] = [
		{ id: "transactions", label: "Expenses", shortLabel: "Expenses", icon: Receipt },
		{ id: "balances", label: "Balances", shortLabel: "Balances", icon: Scale },
		{ id: "settlements", label: "Settle & UPI", shortLabel: "Settle", icon: ArrowRightLeft },
	];

	return (
		<div className="mb-4 sm:mb-5">
			<div className="flex gap-1 p-1 rounded-2xl bg-white/80 border border-indigo-100 shadow-sm">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={`relative flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 sm:py-3 font-semibold text-xs sm:text-sm rounded-xl transition-all touch-manipulation min-h-11 ${
							activeTab === tab.id
								? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
								: "text-gray-600 hover:text-gray-900 hover:bg-indigo-50/60"
						}`}
					>
						{tab.icon && <tab.icon className="h-4 w-4 shrink-0" />}
						<span className="sm:hidden">{tab.shortLabel}</span>
						<span className="hidden sm:inline">{tab.label}</span>
					</button>
				))}
			</div>
		</div>
	);
};
