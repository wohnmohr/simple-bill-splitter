import { Menu } from "@mantine/core";
import { MoreHorizontal, Trash2, UserRound, Users } from "lucide-react";
import { Group } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { calculateBalances, totalSpent } from "@/utils/calculations";

interface GroupSelectorProps {
	groups: Group[];
	selectedGroupId: string | null;
	onSelectGroup: (groupId: string) => void;
	onDeleteGroup: (groupId: string) => void;
	onManageMembers?: () => void;
	onChangeMe?: () => void;
}

/** The viewer's net position in a group, or null when we don't know who they are. */
export const myBalance = (group: Group): number | null => {
	if (!group.meId) return null;
	const mine = calculateBalances(group.members, group.expenses).find(
		(b) => b.personId === group.meId
	);
	return mine ? mine.balance : null;
};

export const BalanceHeadline = ({
	balance,
	group,
	size = "lg",
}: {
	balance: number;
	group: Group;
	size?: "lg" | "sm";
}) => {
	const amount = formatCurrency(Math.abs(balance), group.currency);
	const big = size === "lg";
	if (Math.abs(balance) < 0.01) {
		return (
			<span className={big ? "text-2xl font-semibold text-ink" : "text-sm font-medium text-ink-muted"}>
				You&apos;re all square
			</span>
		);
	}
	const owed = balance > 0;
	return (
		<span className={big ? "text-2xl font-semibold" : "text-sm font-medium"}>
			<span className={big ? "text-ink" : "text-ink-muted"}>
				{owed ? "You get back " : "You owe "}
			</span>
			<span className={`tabular-nums ${owed ? "text-positive" : "text-negative"}`}>
				{amount}
			</span>
		</span>
	);
};

export const GroupSelector = ({
	groups,
	selectedGroupId,
	onSelectGroup,
	onDeleteGroup,
	onManageMembers,
	onChangeMe,
}: GroupSelectorProps) => {
	if (groups.length === 0) return null;

	const selectedGroup = groups.find((g) => g.id === selectedGroupId);
	const mine = selectedGroup ? myBalance(selectedGroup) : null;
	const spent = selectedGroup ? totalSpent(selectedGroup.expenses) : 0;

	return (
		<div className="mb-4">
			{groups.length > 1 && (
				<nav className="mb-3 w-full max-w-full overflow-x-auto overscroll-x-contain" aria-label="Switch group">
					<ul className="flex gap-1.5 w-max pr-1">
						{groups.map((group) => {
							const active = selectedGroupId === group.id;
							return (
								<li key={group.id}>
									<button
										aria-current={active ? "page" : undefined}
										onClick={() => onSelectGroup(group.id)}
										className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
											active
												? "bg-ink text-white"
												: "border border-line-strong bg-white text-ink-soft hover:text-ink"
										}`}
									>
										<span className="block truncate max-w-[140px] sm:max-w-[180px]">
											{group.name}
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				</nav>
			)}

			{selectedGroup && (
				<section className="surface p-4 sm:p-5">
					<div className="flex items-start justify-between gap-3">
						<h1 className="min-w-0 truncate font-display text-2xl sm:text-3xl font-semibold text-ink">
							{selectedGroup.name}
						</h1>
						<Menu position="bottom-end" shadow="md" radius="md" width={200}>
							<Menu.Target>
								<button className="icon-btn -mr-1 -mt-0.5" aria-label="Group options">
									<MoreHorizontal className="h-5 w-5" />
								</button>
							</Menu.Target>
							<Menu.Dropdown>
								{onManageMembers && (
									<Menu.Item leftSection={<Users className="h-4 w-4" />} onClick={onManageMembers}>
										Members & UPI IDs
									</Menu.Item>
								)}
								{onChangeMe && selectedGroup.members.length > 0 && (
									<Menu.Item leftSection={<UserRound className="h-4 w-4" />} onClick={onChangeMe}>
										Change who you are
									</Menu.Item>
								)}
								<Menu.Divider />
								<Menu.Item
									color="red"
									leftSection={<Trash2 className="h-4 w-4" />}
									onClick={() => onDeleteGroup(selectedGroup.id)}
								>
									Delete group
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</div>

					<div className="mt-3 flex items-end justify-between gap-3">
						<div className="min-w-0">
							{mine !== null ? (
								<BalanceHeadline balance={mine} group={selectedGroup} />
							) : (
								<span className="text-2xl font-semibold tabular-nums text-ink">
									{formatCurrency(spent, selectedGroup.currency)}
									<span className="ml-1.5 text-base font-normal text-ink-muted">spent</span>
								</span>
							)}
							{mine !== null && (
								<p className="mt-0.5 text-sm tabular-nums text-ink-muted">
									{formatCurrency(spent, selectedGroup.currency)} spent by the group
								</p>
							)}
						</div>
						{onManageMembers && (
							<button onClick={onManageMembers} className="btn-secondary shrink-0 !py-2">
								<Users className="h-4 w-4" />
								{selectedGroup.members.length === 0
									? "Add members"
									: selectedGroup.members.length}
								<span className="sr-only">
									{selectedGroup.members.length === 1 ? " member" : " members"}
								</span>
							</button>
						)}
					</div>
				</section>
			)}
		</div>
	);
};
