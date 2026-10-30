import { useState } from "react";
import { Menu } from "@mantine/core";
import { ChevronLeft, Lock, MoreHorizontal, Palette, Pencil, Share2, Trash2, UserRound, Users } from "lucide-react";
import { Group } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { calculateSettlements, expensePayers, expenseShares, minorUnits, myBalance, totalSpent } from "@/utils/calculations";
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
	/** Opens Settle up; left out when nobody owes anything. */
	onSettle?: () => void;
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
			<span className={`whitespace-nowrap tabular-nums ${owed ? "text-positive" : "text-ink"}`}>
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
	onSettle,
}: GroupSelectorProps) => {
	const [renaming, setRenaming] = useState(false);
	const mine = myBalance(selectedGroup);
	// People who left stay on past entries, but aren't counted as in the group.
	const here = currentMembers(selectedGroup.members);
	const spent = totalSpent(selectedGroup.expenses);
	const shareBroken = syncStatus === "gone" || syncStatus === "locked";
	const spending = selectedGroup.expenses.filter((e) => e.kind !== "payment");
	// Your share of what was spent and what you paid towards it; recorded payments only move the balance.
	const unit = minorUnits(selectedGroup.currency);
	const meId = selectedGroup.meId;
	const myShare = meId ? spending.reduce((sum, e) => sum + (expenseShares(e, unit).get(meId) ?? 0), 0) : 0;
	const myPaid = meId ? spending.reduce((sum, e) => sum + (expensePayers(e, unit).get(meId) ?? 0), 0) : 0;
	const money = (n: number) => formatCurrency(n, selectedGroup.currency);
	// With one person on the other side, name them: "You owe Ben", "Settle up with Ben".
	const myMoves = meId ? calculateSettlements(selectedGroup.members, selectedGroup.expenses, unit).filter((s) => s.from === meId || s.to === meId) : [];
	const counterparty = myMoves.length === 1 ? selectedGroup.members.find((p) => p.id === (myMoves[0].from === meId ? myMoves[0].to : myMoves[0].from))?.name : undefined;

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
						className="min-w-0 flex-1 rounded-lg border border-line-strong bg-paper px-2 py-0.5 font-display text-[28px] leading-[34px] sm:text-[32px] sm:leading-[38px] font-bold text-ink"
					/>
				) : (
					<h1 className="min-w-0 flex-1 truncate font-display text-[28px] leading-[34px] sm:text-[32px] sm:leading-[38px] font-bold text-ink">
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
								{selectedGroup.currency.code === "INR" ? "Members & UPI IDs" : "Members"}
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

			{/* Who's in it and whether it's shared, on one quiet line under the name. */}
			<div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-muted">
				{onManageMembers ? (
					<button type="button" onClick={onManageMembers} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-ink-soft hover:underline">
						<Users className="h-4 w-4" aria-hidden />
						{selectedGroup.members.length === 0 ? "Add members" : `${here.length} ${here.length === 1 ? "person" : "people"}`}
					</button>
				) : (
					<span>{here.length} {here.length === 1 ? "person" : "people"}</span>
				)}
				<span aria-hidden>·</span>
				<span>
					{spending.length} {spending.length === 1 ? "expense" : "expenses"}
				</span>
				{onShare && (
					<>
						<button
							type="button"
							onClick={onShare}
							className={`ml-auto inline-flex min-h-11 items-center gap-1 font-medium hover:underline ${
								!selectedGroup.sync ? "text-brand-700" : shareBroken ? "text-negative" : "text-positive"
							}`}
						>
							{selectedGroup.sync ? <Lock className="h-3.5 w-3.5" aria-hidden /> : <Share2 className="h-3.5 w-3.5" aria-hidden />}
							{selectedGroup.sync ? SYNC_LABEL[syncStatus ?? "syncing"] : "Share, encrypted"}
						</button>
					</>
				)}
			</div>

			<div className="mt-3 border-t border-line pt-4">
				<p className="text-sm text-ink-muted">Group total</p>
				<p className="mt-1 text-4xl sm:text-[40px] sm:leading-[48px] font-bold tabular-nums text-ink">{money(spent)}</p>
				{mine !== null && (
					<dl className="mt-3 divide-y divide-line">
						<div className="flex items-baseline justify-between gap-3 py-2.5">
							<dt className="text-ink-muted">Your share</dt>
							<dd className="font-semibold tabular-nums text-ink">{money(myShare)}</dd>
						</div>
						<div className="flex items-baseline justify-between gap-3 py-2.5">
							<dt className="text-ink-muted">You paid</dt>
							<dd className="font-semibold tabular-nums text-ink">{money(myPaid)}</dd>
						</div>
						<div className="flex items-baseline justify-between gap-3 py-2.5">
							{Math.abs(mine) < 0.01 ? (
								<dt className="font-semibold text-ink">You&apos;re all square</dt>
							) : (
								<>
									<dt className="font-semibold text-ink">
										{mine > 0 ? (counterparty ? `${counterparty} owes you` : "You get back") : counterparty ? `You owe ${counterparty}` : "You owe"}
									</dt>
									<dd className={`text-lg font-bold tabular-nums ${mine > 0 ? "text-positive" : "text-ink"}`}>{money(Math.abs(mine))}</dd>
								</>
							)}
						</div>
					</dl>
				)}
				{onSettle && (
					<button type="button" onClick={onSettle} className="btn-primary mt-3 w-full">
						{counterparty ? `Settle up with ${counterparty}` : "Settle up"}
					</button>
				)}
			</div>
		</section>
	);
};
