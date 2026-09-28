import { Tab } from "@/types";

interface TabNavigationProps {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
	counts?: Partial<Record<Tab, number>>;
	/** Wide layouts show balances in a side panel instead of a tab. */
	hideBalances?: boolean;
}

const TABS: { id: Tab; label: string }[] = [
	{ id: "transactions", label: "Expenses" },
	{ id: "balances", label: "Balances" },
	{ id: "settlements", label: "Settle up" },
];

export const TabNavigation = ({
	activeTab,
	onTabChange,
	counts = {},
	hideBalances = false,
}: TabNavigationProps) => {
	const tabs = hideBalances ? TABS.filter((t) => t.id !== "balances") : TABS;

	const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const index = tabs.findIndex((t) => t.id === activeTab);
		const next =
			e.key === "ArrowRight"
				? (index + 1) % tabs.length
				: e.key === "ArrowLeft"
				? (index - 1 + tabs.length) % tabs.length
				: e.key === "Home"
				? 0
				: e.key === "End"
				? tabs.length - 1
				: -1;
		if (next < 0) return;
		e.preventDefault();
		onTabChange(tabs[next].id);
		document.getElementById(`tab-${tabs[next].id}`)?.focus();
	};
	return (
		<div
			className={`mb-4 grid gap-1 ${tabs.length === 3 ? "grid-cols-3" : "grid-cols-2"} rounded-xl bg-ink/[0.05] p-1`}
			role="tablist"
			aria-label="Group sections"
			onKeyDown={onKeyDown}
		>
			{tabs.map((tab) => {
				const active = activeTab === tab.id;
				const count = counts[tab.id];
				return (
					<button
						key={tab.id}
						role="tab"
						id={`tab-${tab.id}`}
						aria-selected={active}
						aria-controls={`panel-${tab.id}`}
						tabIndex={active ? 0 : -1}
						onClick={() => onTabChange(tab.id)}
						className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-all ${
							active
								? "bg-white text-ink shadow-card ring-1 ring-line"
								: "text-ink-muted hover:text-ink"
						}`}
					>
						{tab.label}
						{count !== undefined && count > 0 && (
							<span
								className={`rounded-full px-1.5 text-xs tabular-nums ${
									active ? "bg-brand-50 text-brand-700" : "bg-ink/[0.06] text-ink-muted"
								}`}
							>
								{count}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
};
