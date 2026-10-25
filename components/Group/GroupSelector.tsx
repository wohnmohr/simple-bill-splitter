import { useState } from "react";
import { Menu } from "@mantine/core";
import { ChevronLeft, Lock, MoreHorizontal, Palette, Pencil, Share2, Trash2, UserRound, Users } from "lucide-react";
import { Group } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { myBalance, totalSpent } from "@/utils/calculations";
import type { SyncStatus } from "@/utils/groupSync";
import { currentMembers } from "@/utils/members";

interface GroupSelectorProps {
	/** The open group. */
	group: Group;
	onDeleteGroup: (groupId: string) => void;
	/** Back to the list of groups. */
	onBack: () => void;
	onManageMembers?: () => void;
	onChangeMe?: () => void;
	/** Opens sharing: turn on sync, or see the link of a synced group. */
	onShare?: () => void;
	/** Opens the theme picker. */
	onTheme?: () => void;
	/** Renames the group; for a synced group everyone sees the new name. */
	onRename?: (name: string) => void;
	syncStatus?: SyncStatus;
}

const SYNC_LABEL: Record<SyncStatus, string> = {
	synced: "Shared · synced",
	syncing: "Shared · syncing…",
	offline: "Shared · offline, will sync",
	gone: "Link reset or deleted",
	locked: "Can't open the group",
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
			<span className={`whitespace-nowrap tabular-nums ${owed ? "text-positive" : "text-negative"}`}>
				{amount}
			</span>
		</span>
	);
};

export const GroupSelector = ({
	group: selectedGroup,
	onDeleteGroup,
	onBack,
	onManageMembers,
	onChangeMe,
	onShare,
	onTheme,
	onRename,
	syncStatus,
}: GroupSelectorProps) => {
	const [renaming, setRenaming] = useState(false);
	const mine = myBalance(selectedGroup);
	// People who left stay on past entries, but aren't counted as in the group.
	const here = currentMembers(selectedGroup.members);
	const spent = totalSpent(selectedGroup.expenses);
	const shareBroken = syncStatus === "gone" || syncStatus === "locked";

	return (
		<section className="surface mb-4 p-4 sm:p-5">
			<div className="flex items-center gap-1">
				<button onClick={onBack} className="icon-btn -ml-2 shrink-0" aria-label="All groups">
					<ChevronLeft className="h-5 w-5" />
				</button>
				{renaming && onRename ? (
					<input
						autoFocus
						defaultValue={selectedGroup.name}
						maxLength={60}
						aria-label="Group name"
						enterKeyHint="done"
						onFocus={(e) => e.target.select()}
						onBlur={(e) => {
							const name = e.target.value.trim();
							if (name && name !== selectedGroup.name) onRename(name);
							setRenaming(false);
						}}
						onKeyDown={(e) => {
							if (e.key === "Escape") e.currentTarget.value = selectedGroup.name;
							if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
						}}
						className="min-w-0 flex-1 rounded-lg border border-line-strong bg-paper px-2 py-0.5 font-display text-2xl sm:text-3xl font-semibold text-ink"
					/>
				) : (
					<h1 className="min-w-0 flex-1 truncate font-display text-2xl sm:text-3xl font-semibold text-ink">
						{selectedGroup.name}
					</h1>
				)}
				<Menu position="bottom-end" shadow="md" radius="md" width={200}>
					<Menu.Target>
						<button className="icon-btn -mr-1 shrink-0" aria-label="Group options">
							<MoreHorizontal className="h-5 w-5" />
						</button>
					</Menu.Target>
					<Menu.Dropdown>
						{onRename && (
							<Menu.Item leftSection={<Pencil className="h-4 w-4" />} onClick={() => setRenaming(true)}>
								Rename
							</Menu.Item>
						)}
						{onManageMembers && (
							<Menu.Item leftSection={<Users className="h-4 w-4" />} onClick={onManageMembers}>
								Members & UPI IDs
							</Menu.Item>
						)}
						{onShare && (
							<Menu.Item leftSection={<Share2 className="h-4 w-4" />} onClick={onShare}>
								{selectedGroup.sync ? "Group link & privacy" : "Share & sync"}
							</Menu.Item>
						)}
						{onTheme && (
							<Menu.Item leftSection={<Palette className="h-4 w-4" />} onClick={onTheme}>
								Theme
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
							{selectedGroup.sync ? "Remove from this device" : "Delete group"}
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</div>

			<div className="mt-2 flex items-end justify-between gap-3">
				<div className="min-w-0">
					{mine !== null ? (
						<BalanceHeadline balance={mine} group={selectedGroup} />
					) : (
						<span className="text-2xl font-semibold tabular-nums text-ink">
							{formatCurrency(spent, selectedGroup.currency)}
							<span className="ml-1.5 text-base font-normal text-ink-muted">spent</span>
						</span>
					)}
					{/* What the group spent and whether it's shared, on one quiet line. */}
					<p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-ink-muted">
						{mine !== null && (
							<span className="tabular-nums">{formatCurrency(spent, selectedGroup.currency)} spent ·</span>
						)}
						{onShare && (
							<button
								type="button"
								onClick={onShare}
								className={`inline-flex items-center gap-1 font-medium hover:underline ${
									!selectedGroup.sync ? "text-brand-700" : shareBroken ? "text-negative" : "text-positive"
								}`}
							>
								{selectedGroup.sync ? <Lock className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
								{selectedGroup.sync ? SYNC_LABEL[syncStatus ?? "syncing"] : "Share, encrypted"}
							</button>
						)}
					</p>
				</div>
				{onManageMembers && (
					<button onClick={onManageMembers} className="btn-secondary shrink-0 !py-2">
						<Users className="h-4 w-4" />
						{selectedGroup.members.length === 0 ? "Add members" : here.length}
						<span className="sr-only">{here.length === 1 ? " member" : " members"}</span>
					</button>
				)}
			</div>
		</section>
	);
};
