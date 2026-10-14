import { ChevronRight, Lock, Plus, Trash2 } from "lucide-react";
import { Group } from "@/types";
import { MAX_GROUPS } from "@/constants";
import { formatCurrency } from "@/utils/formatting";
import { totalSpent } from "@/utils/calculations";
import { BalanceHeadline, myBalance } from "@/components/Group/GroupSelector";

interface GroupsHomeProps {
	groups: Group[];
	onSelectGroup: (groupId: string) => void;
	onDeleteGroup: (groupId: string) => void;
	onCreateGroup: () => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const GroupsHome = ({
	groups,
	onSelectGroup,
	onDeleteGroup,
	onCreateGroup,
}: GroupsHomeProps) => {
	const canCreate = groups.length < MAX_GROUPS;

	return (
		<div>
			<div className="mb-4 flex items-end justify-between gap-3">
				<div>
					<h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
						Your groups
					</h1>
					<p className="mt-1 text-sm text-ink-muted">
						Saved on this device. Share a group to add expenses together, end-to-end encrypted.
					</p>
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
				{groups.map((group) => {
					const total = totalSpent(group.expenses);
					const mine = myBalance(group);
					return (
						<li key={group.id} className="group/row relative flex items-center lg:surface lg:overflow-hidden">
							<button
								onClick={() => onSelectGroup(group.id)}
								className="flex flex-1 min-w-0 items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-paper"
							>
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-display text-lg font-semibold text-brand-700">
									{group.name.trim().charAt(0).toUpperCase() || "G"}
								</span>
								<span className="min-w-0 flex-1">
									<span className="flex items-center gap-1.5 font-semibold text-ink">
										<span className="truncate">{group.name}</span>
										{group.sync && <Lock className="h-3.5 w-3.5 shrink-0 text-positive" aria-label="Shared, end-to-end encrypted" />}
									</span>
									<span className="mt-0.5 block text-sm text-ink-muted">
										{mine !== null ? (
											<BalanceHeadline balance={mine} group={group} size="sm" />
										) : (
											<>
												{plural(group.members.length, "member")} ·{" "}
												{plural(group.expenses.filter((e) => e.kind !== "payment").length, "expense")}
											</>
										)}
									</span>
								</span>
								<span className="hidden sm:block text-right shrink-0 pr-10">
									<span className="block font-semibold tabular-nums text-ink">
										{formatCurrency(total, group.currency)}
									</span>
									<span className="block text-xs text-ink-muted">spent</span>
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

			{!canCreate && (
				<p className="mt-3 text-xs text-ink-muted">
					You&apos;ve reached the {MAX_GROUPS}-group limit. Delete one to start another.
				</p>
			)}
		</div>
	);
};
