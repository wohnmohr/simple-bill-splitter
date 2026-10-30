import type { ReactNode } from "react";
import { ChevronRight, Lock, Plus, Trash2 } from "lucide-react";
import { Group } from "@/types";
import { MAX_GROUPS } from "@/constants";
import { formatCurrency } from "@/utils/formatting";
import { myBalance, myTotals, totalSpent } from "@/utils/calculations";
import { BalanceHeadline } from "@/components/Group/GroupSelector";
import { InstallCard } from "@/components/Group/InstallCard";
import { BackupCard } from "@/components/Group/BackupCard";
import { PasteLink } from "@/components/Group/PasteLink";
import { RemindCard } from "@/components/Group/RemindCard";
import type { useBackup } from "@/hooks/useBackup";
import { currentMembers } from "@/utils/members";

interface GroupsHomeProps {
	groups: Group[];
	onSelectGroup: (groupId: string) => void;
	onDeleteGroup: (groupId: string) => void;
	onCreateGroup: () => void;
	/** Start a new group by typing an expense. */
	quickAdd: ReactNode;
	backup: ReturnType<typeof useBackup>;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const GroupsHome = ({
	groups,
	onSelectGroup,
	onDeleteGroup,
	onCreateGroup,
	quickAdd,
	backup,
}: GroupsHomeProps) => {
	const canCreate = groups.length < MAX_GROUPS;
	// With one group its own row already says it; the sum earns a line from two.
	const totals = groups.length > 1 ? myTotals(groups) : [];

	return (
		<div>
			<div className="mb-4 flex items-end justify-between gap-3">
				<div>
					<h1 className="font-display text-[28px] leading-[34px] sm:text-[32px] sm:leading-[38px] font-bold text-ink">
						Your groups
					</h1>
					{totals.length > 0 ? (
						<p className="mt-1 text-sm font-medium text-ink-muted">
							{totals.map(({ currency, owe, getBack }) => (
								<span key={currency.code} className="block">
									{owe > 0 && (
										<>You owe <span className="tabular-nums font-semibold text-ink">{formatCurrency(owe, currency)}</span></>
									)}
									{owe > 0 && getBack > 0 && " · "}
									{getBack > 0 && (
										<>You get back <span className="tabular-nums text-positive">{formatCurrency(getBack, currency)}</span></>
									)}
								</span>
							))}
						</p>
					) : (
						<p className="mt-1 text-sm text-ink-muted">
							Saved on this device. Share a group to add expenses together, end-to-end encrypted.
						</p>
					)}
				</div>
				{canCreate && (
					<button onClick={onCreateGroup} className="btn-primary shrink-0">
						<Plus className="h-4 w-4" />
						New group
					</button>
				)}
			</div>

			{/* A list on phones; a grid of cards on wide screens. */}
			<ul className="surface divide-y divide-line overflow-hidden lg:grid lg:grid-cols-2 lg:gap-3 lg:divide-y-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none">
				{/* Closed groups are records: they go below the ones still in use. */}
				{[...groups].sort((a, b) => Number(!!a.closedAt) - Number(!!b.closedAt)).map((group) => {
					const total = totalSpent(group.expenses);
					const mine = myBalance(group);
					return (
						<li key={group.id} className="group/row relative flex items-center lg:surface lg:overflow-hidden">
							<button
								onClick={() => onSelectGroup(group.id)}
								className="flex flex-1 min-w-0 items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-paper"
							>
								<span className="min-w-0 flex-1">
									<span className="flex items-center gap-1.5 font-semibold text-ink">
										<span className="truncate">{group.name}</span>
										{group.sync && <Lock className="h-3.5 w-3.5 shrink-0 text-positive" aria-label="Shared, end-to-end encrypted" />}
									</span>
									<span className="mt-0.5 block text-sm text-ink-muted">
										{group.closedAt ? (
											<>Closed · {plural(group.expenses.filter((e) => e.kind !== "payment").length, "expense")}</>
										) : mine !== null ? (
											<>
												{/* Phones: your balance here. Wider: it moves to the right column, and this line says who and how much. */}
												<span className="sm:hidden"><BalanceHeadline balance={mine} group={group} size="sm" /></span>
												<span className="hidden sm:inline">
													{plural(currentMembers(group.members).length, "member")} ·{" "}
													<span className="tabular-nums">{formatCurrency(total, group.currency)}</span> spent
												</span>
											</>
										) : (
											<>
												{plural(currentMembers(group.members).length, "member")} ·{" "}
												{plural(group.expenses.filter((e) => e.kind !== "payment").length, "expense")}
											</>
										)}
									</span>
								</span>
								<span className="hidden sm:block text-right shrink-0 pr-10">
									{mine !== null && !group.closedAt ? (
										Math.abs(mine) < 0.01 ? (
											<span className="block text-sm text-ink-muted">All square</span>
										) : (
											<>
												<span className={`block font-semibold tabular-nums ${mine > 0 ? "text-positive" : "text-ink"}`}>
													{formatCurrency(Math.abs(mine), group.currency)}
												</span>
												<span className="block text-xs text-ink-muted">{mine > 0 ? "you get back" : "you owe"}</span>
											</>
										)
									) : (
										<>
											<span className="block font-semibold tabular-nums text-ink">
												{formatCurrency(total, group.currency)}
											</span>
											<span className="block text-xs text-ink-muted">spent</span>
										</>
									)}
								</span>
								<ChevronRight className="h-5 w-5 shrink-0 text-ink-muted sm:hidden" />
							</button>
							<button
								onClick={() => onDeleteGroup(group.id)}
								className="icon-btn hidden sm:inline-flex absolute right-3 hover:!text-negative"
								aria-label={group.sync ? `Remove ${group.name} from this device` : `Delete ${group.name}`}
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</li>
					);
				})}
			</ul>

			{/* Your groups lead; adding by typing and reminders come after them. */}
			<div className="mt-4 space-y-4">
				{canCreate && quickAdd}
				<RemindCard groups={groups} />
			</div>

			{!canCreate && (
				<p className="mt-3 text-xs text-ink-muted">
					You&apos;ve reached the {MAX_GROUPS}-group limit. Delete one to start another.
				</p>
			)}

			{/* Worth a home-screen spot once they've actually split something. */}
			<BackupCard backup={backup} />
			<div className="mt-4 text-sm">
				<PasteLink />
			</div>
			{groups.some((g) => g.expenses.length > 0) && <InstallCard />}
		</div>
	);
};

/** The groups list's shape while this device's groups are read. */
export const GroupsSkeleton = () => (
	<div aria-busy="true" aria-label="Loading your groups" className="animate-pulse">
		<div className="mb-4 h-8 w-44 rounded-lg bg-ink/[0.06] sm:h-9" />
		<ul className="surface divide-y divide-line overflow-hidden">
			{[0, 1].map((i) => (
				<li key={i} className="flex items-center gap-3 px-4 py-4">
					<span className="flex-1 space-y-2">
						<span className="block h-4 w-2/5 rounded bg-ink/[0.06]" />
						<span className="block h-3 w-1/4 rounded bg-ink/[0.05]" />
					</span>
				</li>
			))}
		</ul>
	</div>
);
