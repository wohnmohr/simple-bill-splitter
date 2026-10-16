"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@mantine/hooks";
import { ChevronLeft, Link2, Plus, UserPlus } from "lucide-react";
import { Tab, Currency, Expense, Group, Settlement } from "@/types";
import { DEFAULT_CURRENCY } from "@/constants";
import { calculateBalances, calculateSettlements, splitWeights } from "@/utils/calculations";
import { useGroups } from "@/hooks/useGroups";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useExpenses } from "@/hooks/useExpenses";
import { Header } from "@/components/Header/Header";
import { GroupSelector } from "@/components/Group/GroupSelector";
import { CreateGroupModal } from "@/components/Group/CreateGroupModal";
import { AddMembersModal } from "@/components/Group/AddMembersModal";
import { GroupsHome } from "@/components/Group/GroupsHome";
import { SyncModal } from "@/components/Group/SyncModal";
import { ThemeModal } from "@/components/Group/ThemeModal";
import { IdentitySheet } from "@/components/Group/IdentitySheet";
import { InviteNudge } from "@/components/Group/InviteNudge";
import { shownMembers } from "@/utils/identity";
import { applyTheme } from "@/utils/themes";
import { TabNavigation } from "@/components/Tabs/TabNavigation";
import { ExpenseList } from "@/components/Expense/ExpenseList";
import { ExpenseFormModal } from "@/components/Expense/ExpenseFormModal";
import { ExpenseViewModal } from "@/components/Expense/ExpenseViewModal";
import { BalanceList } from "@/components/Balances/BalanceList";
import { SettlementList } from "@/components/Settlements/SettlementList";
import { FloatingActionButton } from "@/components/UI/FloatingActionButton";
import { EmptyGroupState } from "@/components/EmptyStates/EmptyGroupState";
import { Toast, ToastState } from "@/components/UI/Toast";
import { Modal } from "@/components/UI/Modal";
import { FeedbackForm } from "@/components/Feedback/FeedbackForm";
import { SettledFeedbackCard } from "@/components/Feedback/SettledFeedbackCard";
import { collectFeedbackContext } from "@/lib/feedbackContext";
import { formatCurrency } from "@/utils/formatting";
import { track } from "@/lib/analytics";
import { consumeOpenOnSettleUp } from "@/utils/shareImport";
import { parseQuickAdd, resolveQuickAdd, type QuickResolved } from "@/utils/quickAdd";
import { applyQuickAdd } from "@/utils/quickAddSave";
import { QuickAddBox } from "@/components/QuickAdd/QuickAddBox";
import { QuickAddPreview } from "@/components/QuickAdd/QuickAddPreview";
import { quickAddExamples } from "@/utils/quickAddSuggest";

const NEW_GROUP_EXAMPLES = quickAddExamples([]);

export default function Home() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<Tab>("transactions");
	// Arrived from a payment reminder: start on what you owe.
	useEffect(() => {
		if (consumeOpenOnSettleUp()) setActiveTab("settlements");
	}, []);

	const [showGroupForm, setShowGroupForm] = useState(false);
	const [showExpenseForm, setShowExpenseForm] = useState(false);
	const [showMembersModal, setShowMembersModal] = useState(false);
	const [showSync, setShowSync] = useState(false);
	const [showTheme, setShowTheme] = useState(false);
	/** "pick": who are you? "invite": the same, then share the group. */
	const [identityAsk, setIdentityAsk] = useState<"pick" | "invite" | null>(null);
	/** A typed sentence being checked before it is saved, as a new group or into the open one. */
	const [quickAdd, setQuickAdd] = useState<{ quick: QuickResolved; newGroup: boolean } | null>(null);
	/** Bumped on every save, so the boxes start empty again. */
	const [quickAddSaves, setQuickAddSaves] = useState(0);
	const [viewingExpenseId, setViewingExpenseId] = useState<string | null>(null);
	const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
	const [editExpenseData, setEditExpenseData] = useState<{
		amount: string;
		paidBy: string;
		participants: Set<string>;
		description?: string;
		splitMethod?: string;
		weights?: Record<string, number>;
		date?: number;
		repeat: boolean;
	} | null>(null);

	const {
		groups,
		selectedGroupId,
		setSelectedGroupId,
		currentGroup,
		createGroup,
		deleteGroup,
		updateGroupCurrency,
		setGroupMe,
		setGroupTheme,
		setGroups,
		sync,
	} = useGroups();

	// An open group paints the whole page (modals included) in its theme;
	// the group list and the rest of the site keep SplitBiller's colors.
	const openTheme = selectedGroupId ? currentGroup?.theme : undefined;
	useEffect(() => applyTheme(openTheme), [openTheme]);
	useEffect(() => () => applyTheme(undefined), []);

	const { addMember, updateMemberUpi, renameMember, markJoined, setNickname, deleteMember } = useGroupMembers(setGroups, currentGroup);

	const { addExpense, updateExpense, deleteExpense, recordPayment } = useExpenses(
		groups,
		setGroups,
		currentGroup
	);

	// Display names: this device's private nicknames in place of shared names.
	const people = currentGroup ? shownMembers(currentGroup) : [];
	const expenses = currentGroup?.expenses || [];
	const balances = calculateBalances(people, expenses);
	const settlements = calculateSettlements(people, expenses);
	const currency = currentGroup?.currency || DEFAULT_CURRENCY;

	const [toast, setToast] = useState<ToastState>(null);
	const [showFeedback, setShowFeedback] = useState(false);
	const dismissToast = useCallback(() => setToast(null), []);

	const nameOf = (id: string) => people.find((p) => p.id === id)?.name || "Unknown";

	const handleRecordPayment = (s: Settlement) => {
		const id = recordPayment(s.from, s.to, s.amount);
		if (!id) return;
		setToast({
			id: Date.now(),
			message: `${nameOf(s.from)} paid ${nameOf(s.to)} ${formatCurrency(s.amount, currency)}`,
			actionLabel: "Undo",
			onAction: () => deleteExpense(id),
		});
	};

	// New expenses default to the viewer, else whoever paid most recently.
	const lastPayer = [...expenses].reverse().find((e) => e.kind !== "payment")?.paidBy;
	const defaultPayerId = currentGroup?.meId || lastPayer;

	const handleCreateGroup = (name: string, currency: Currency) => {
		const ok = createGroup(name, currency);
		if (ok) {
			track("dashboard_group_created", { currency: currency.code });
		}
		setShowGroupForm(false);
	};

	const handleAddExpense = (
		amount: number,
		paidBy: string,
		participants: Set<string>,
		description?: string,
		splitMethod?: string,
		weights?: Record<string, number>,
		date?: number,
		repeatMonthly?: boolean
	) => {
		addExpense(
			amount,
			paidBy,
			participants,
			description,
			splitMethod as any,
			weights,
			date,
			repeatMonthly
		);
		track("dashboard_expense_added", {
			participant_count: participants.size,
			split_method: splitMethod || "equally",
			currency: currency.code,
			repeats: Boolean(repeatMonthly),
		});
		setShowExpenseForm(false);
	};

	// Quick add reads the sentence on this device; analytics get counts only, never what was typed.
	const handleQuickAdd = (text: string, newGroup: boolean) => {
		const group = newGroup ? undefined : currentGroup;
		const members = group ? shownMembers(group) : [];
		const quick = resolveQuickAdd(parseQuickAdd(text, members.map((m) => m.name)), members, group?.meId);
		if (!quick.expenses.length) return;
		track("quick_add_previewed", {
			expense_count: quick.expenses.length,
			unsure_count: quick.expenses.reduce((n, e) => n + e.unsure.length, 0),
			new_group: newGroup,
		});
		setQuickAdd({ quick, newGroup });
	};

	const handleSaveQuickAdd = (quick: QuickResolved, groupName: string, edited: boolean) => {
		if (!quickAdd) return;
		const fill = (g: Group) => applyQuickAdd(g, quick);
		if (quickAdd.newGroup) createGroup(groupName, DEFAULT_CURRENCY, fill);
		else if (currentGroup) setGroups((prev) => prev.map((g) => (g.id === currentGroup.id ? fill(g) : g)));
		track("quick_add_saved", { expense_count: quick.expenses.length, edited, new_group: quickAdd.newGroup });
		setQuickAdd(null);
		setQuickAddSaves((n) => n + 1);
	};

	const handleAddMember = (memberName: string, upiId?: string) => {
		const ok = addMember(memberName, upiId);
		if (ok) track("dashboard_member_added");
		return ok;
	};

	// Who you are in this group. Opening a shared group for the first time asks
	// (joining anonymously is the default); "Invite with a link" asks, then shares.
	const identityOpen = !!currentGroup && (identityAsk !== null || (!!currentGroup.sync && currentGroup.meId === undefined && !showSync));
	// Inviting asks who you are first (if nobody has), so friends can't pick you.
	const startInvite = () => (currentGroup?.meId === undefined ? setIdentityAsk("invite") : setShowSync(true));
	const finishIdentity = (how: "joined" | "claimed" | "looking" | "closed") => {
		if (currentGroup && how !== "closed") track("group_identity_chosen", { how, synced: !!currentGroup.sync });
		if (identityAsk === "invite") setShowSync(true);
		setIdentityAsk(null);
	};

	const handleTabChange = (tab: Tab) => {
		setActiveTab(tab);
		if (tab === "settlements") {
			track("dashboard_settlements_tab_viewed", {
				settlement_count: settlements.length,
				expense_count: expenses.length,
				member_count: people.length,
			});
		}
	};

	const handleStartEditExpense = (expense: Expense) => {
		setEditingExpenseId(expense.id);
		setViewingExpenseId(null);
		setEditExpenseData({
			amount: expense.amount.toString(),
			paidBy: expense.paidBy,
			participants: new Set(expense.participants),
			description: expense.description,
			splitMethod: expense.splitMethod || "equally",
			weights: splitWeights(expense),
			date: expense.createdAt,
			repeat: !!expense.repeat,
		});
	};

	const handleSaveEditExpense = (
		amount: number,
		paidBy: string,
		participants: Set<string>,
		description?: string,
		splitMethod?: string,
		weights?: Record<string, number>,
		date?: number,
		repeatMonthly?: boolean
	) => {
		if (editingExpenseId) {
			updateExpense(
				editingExpenseId,
				amount,
				paidBy,
				participants,
				description,
				splitMethod as any,
				weights,
				date,
				repeatMonthly
			);
			setEditingExpenseId(null);
			setEditExpenseData(null);
		}
	};

	const handleCancelEditExpense = () => {
		setEditingExpenseId(null);
		setEditExpenseData(null);
	};

	/**
	 * Every delete happens immediately and offers Undo, which puts the whole
	 * group back exactly as it was (member removal also drops their expenses).
	 */
	const offerUndo = (groupId: string, message: string, afterRestore?: () => void) => {
		const index = groups.findIndex((g) => g.id === groupId);
		const snapshot = groups[index];
		if (!snapshot) return;
		setToast({
			id: Date.now(),
			message,
			actionLabel: "Undo",
			onAction: () => {
				setGroups((prev) => {
					const rest = prev.filter((g) => g.id !== groupId);
					rest.splice(Math.min(index, rest.length), 0, snapshot);
					return rest;
				});
				afterRestore?.();
			},
		});
	};

	const handleDeleteGroup = (groupId: string) => {
		const group = groups.find((g) => g.id === groupId);
		if (!group) return;
		const wasOpen = selectedGroupId === groupId;
		offerUndo(groupId, `Deleted ${group.name}`, () => {
			if (wasOpen) setSelectedGroupId(groupId);
		});
		deleteGroup(groupId);
		if (wasOpen) setSelectedGroupId(null);
	};

	const handleDeleteMember = (personId: string) => {
		if (!currentGroup) return;
		const involved = currentGroup.expenses.filter(
			(e) => e.paidBy === personId || e.participants.includes(personId)
		).length;
		offerUndo(
			currentGroup.id,
			involved > 0
				? `Removed ${nameOf(personId)} and ${involved} ${involved === 1 ? "entry" : "entries"} they were in`
				: `Removed ${nameOf(personId)}`
		);
		deleteMember(personId);
	};

	const handleDeleteExpense = (expenseId: string) => {
		const expense = expenses.find((e) => e.id === expenseId);
		if (currentGroup && expense) {
			offerUndo(
				currentGroup.id,
				expense.kind === "payment"
					? `Deleted payment from ${nameOf(expense.paidBy)}`
					: `Deleted ${expense.description || "expense"}`
			);
		}
		deleteExpense(expenseId);
		if (viewingExpenseId === expenseId) {
			setViewingExpenseId(null);
		}
		if (editingExpenseId === expenseId) {
			setEditingExpenseId(null);
			setEditExpenseData(null);
		}
	};

	const viewingExpense = expenses.find((e) => e.id === viewingExpenseId);

	// On wide screens Balances lives in a side panel, so it leaves the tab bar.
	const isWide = useMediaQuery("(min-width: 1024px)") ?? false;
	const inGroup = !!currentGroup && currentGroup.members.length > 0;
	const shownTab: Tab = isWide && activeTab === "balances" ? "transactions" : activeTab;

	return (
		<main className="page-shell min-h-screen bg-paper pb-28 safe-pb">
			{/* One width for every screen, so the header never shifts between the list and a group. */}
			<div
				className="w-full mx-auto min-w-0 max-w-2xl px-4 py-3 sm:py-5 lg:max-w-5xl lg:px-6"
			>
				<Header
					onFeedback={() => {
						track("feedback_opened", { source: "header" });
						setShowFeedback(true);
					}}
				/>

				{groups.length === 0 ? (
					<EmptyGroupState
						onCreateGroup={() => setShowGroupForm(true)}
						quickAdd={<QuickAddBox key={quickAddSaves} label="Describe a shared expense" examples={NEW_GROUP_EXAMPLES} onSubmit={(t) => handleQuickAdd(t, true)} />}
					/>
				) : selectedGroupId === null ? (
					<GroupsHome
						groups={groups}
						onSelectGroup={setSelectedGroupId}
						onDeleteGroup={handleDeleteGroup}
						onCreateGroup={() => setShowGroupForm(true)}
						quickAdd={<QuickAddBox key={quickAddSaves} label="Start a group by describing an expense" examples={NEW_GROUP_EXAMPLES} onSubmit={(t) => handleQuickAdd(t, true)} />}
					/>
				) : (
					<>
					<button
						onClick={() => setSelectedGroupId(null)}
						className="btn-ghost -ml-2.5 mb-2"
					>
						<ChevronLeft className="h-4 w-4" />
						All groups
					</button>
					<div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
					<div className="min-w-0">
						<GroupSelector
							groups={groups}
							selectedGroupId={selectedGroupId}
							onSelectGroup={setSelectedGroupId}
							onDeleteGroup={handleDeleteGroup}
							onManageMembers={() => setShowMembersModal(true)}
							onShare={() => setShowSync(true)}
							onTheme={() => setShowTheme(true)}
							syncStatus={currentGroup ? sync.status[currentGroup.id] : undefined}
							onChangeMe={() => setIdentityAsk("pick")}
						/>

						{currentGroup && (
							<>
								{currentGroup.members.length === 0 && (
									<div className="surface px-6 py-10 text-center">
										<p className="font-semibold text-ink">Who&apos;s in this group?</p>
										<p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
											Add everyone yourself, or send a link and let each person join from their own
											phone, anonymously if they like.
										</p>
										<div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
											<button onClick={startInvite} className="btn-primary">
												<Link2 className="h-4 w-4" />
												Invite with a link
											</button>
											<button onClick={() => setShowMembersModal(true)} className="btn-secondary">
												<UserPlus className="h-4 w-4" />
												Add members
											</button>
										</div>
									</div>
								)}

								{currentGroup.members.length > 0 && (
									<>
										{!currentGroup.sync &&
											currentGroup.members.length > 1 &&
											expenses.some((e) => e.kind !== "payment") && (
												<InviteNudge groupId={currentGroup.id} onInvite={startInvite} />
											)}

										<TabNavigation
											activeTab={shownTab}
											onTabChange={handleTabChange}
											hideBalances={isWide}
											counts={{
												transactions: expenses.length,
												settlements: settlements.length,
											}}
										/>

										<div
											role="tabpanel"
											id={`panel-${shownTab}`}
											aria-labelledby={`tab-${shownTab}`}
										>
										{shownTab === "transactions" && (
											<>
											<div className="mb-3">
												<QuickAddBox
													key={quickAddSaves}
													label="Add an expense by typing it"
													examples={quickAddExamples(people.filter((p) => p.id !== currentGroup?.meId).map((p) => p.name))}
													memberNames={people.map((p) => p.name)}
													onSubmit={(t) => handleQuickAdd(t, false)}
												/>
											</div>
											<ExpenseList
												expenses={expenses}
												people={people}
												currency={currency}
												onExpenseClick={setViewingExpenseId}
												onExpenseEdit={handleStartEditExpense}
												onExpenseDelete={handleDeleteExpense}
											/>
											</>
										)}

										{shownTab === "balances" && (
											<BalanceList
												balances={balances}
												people={people}
												currency={currency}
											/>
										)}

										{shownTab === "settlements" && (
											<SettlementList
												settlements={settlements}
												people={people}
												currency={currency}
												groupName={currentGroup.name}
												expenses={expenses}
												onUpdateMemberUpi={updateMemberUpi}
												meId={currentGroup.meId}
												sharePeople={currentGroup.members}
												syncLink={currentGroup.sync}
												onSetMe={(id) => setGroupMe(currentGroup.id, id)}
												onRecordPayment={handleRecordPayment}
												settledSlot={
													<SettledFeedbackCard
														groupId={currentGroup.id}
														getContext={() =>
															collectFeedbackContext({
																trigger: "group_settled",
																group: currentGroup,
																tab: "settlements",
															})
														}
													/>
												}
											/>
										)}
										</div>

										{/* On wide screens "Add expense" sits at the top of the side panel instead. */}
										{!isWide && (
											<FloatingActionButton
												onClick={() => setShowExpenseForm(true)}
												showTooltip={expenses.length === 0}
											/>
										)}
									</>
								)}
							</>
						)}
					</div>

					{isWide && inGroup && currentGroup && (
						<aside className="sticky top-5 space-y-3" aria-labelledby="balances-heading">
							<button onClick={() => setShowExpenseForm(true)} className="btn-primary w-full !py-3 !text-base">
								<Plus className="h-5 w-5" strokeWidth={2.5} />
								Add expense
							</button>
							<h2 id="balances-heading" className="label-text px-1 pt-2">
								Balances
							</h2>
							<BalanceList balances={balances} people={people} currency={currency} />
						</aside>
					)}
					</div>
					</>
				)}

				<Toast
					toast={toast}
					onDismiss={dismissToast}
					raised={!isWide && !!currentGroup && currentGroup.members.length > 0}
				/>

				<Modal isOpen={showFeedback} onClose={() => setShowFeedback(false)} title="Feedback">
					<div className="pb-2">
						<FeedbackForm
							trigger="manual"
							getContext={() =>
								collectFeedbackContext({
									trigger: "manual",
									group: currentGroup,
									tab: selectedGroupId ? shownTab : "groups",
								})
							}
							onDone={() => setShowFeedback(false)}
						/>
					</div>
				</Modal>

				<CreateGroupModal
					isOpen={showGroupForm}
					onClose={() => setShowGroupForm(false)}
					onCreate={handleCreateGroup}
					groupCount={groups.length}
				/>

				{currentGroup && (
					<IdentitySheet
						isOpen={identityOpen}
						group={currentGroup}
						onJoin={(name, personId) => {
							const id = addMember(name, undefined, { id: personId });
							if (id) setGroupMe(currentGroup.id, id);
							finishIdentity("joined");
						}}
						onClaim={(id) => {
							setGroupMe(currentGroup.id, id);
							markJoined(id);
							finishIdentity("claimed");
						}}
						onJustLooking={() => {
							setGroupMe(currentGroup.id, null);
							finishIdentity("looking");
						}}
						onClose={() => {
							// Closing a first-time ask means "just looking", so it doesn't come straight back.
							if (currentGroup.meId === undefined) setGroupMe(currentGroup.id, null);
							finishIdentity("closed");
						}}
					/>
				)}

				{currentGroup && (
					<ThemeModal
						isOpen={showTheme}
						onClose={() => setShowTheme(false)}
						group={currentGroup}
						onChange={setGroupTheme}
					/>
				)}

				{currentGroup && (
					<SyncModal
						isOpen={showSync}
						onClose={() => setShowSync(false)}
						group={currentGroup}
						status={sync.status[currentGroup.id]}
						expiresAt={sync.expiresAt(currentGroup.id)}
						onEnable={sync.enableSync}
						onResetLink={sync.resetLink}
						onDeleteForEveryone={sync.deleteSyncedGroup}
						onKeepLocal={sync.keepLocalCopy}
					/>
				)}

				{currentGroup && (
					<AddMembersModal
						isOpen={showMembersModal}
						onClose={() => setShowMembersModal(false)}
						group={currentGroup}
						onAddMember={handleAddMember}
						onUpdateMemberUpi={updateMemberUpi}
						onRenameMember={renameMember}
						onSetNickname={setNickname}
						onDeleteMember={handleDeleteMember}
					/>
				)}

				<ExpenseFormModal
					isOpen={showExpenseForm}
					onClose={() => setShowExpenseForm(false)}
					onSubmit={handleAddExpense}
					people={people}
					currency={currency}
					defaultPayerId={defaultPayerId}
				/>

				{quickAdd && (
					<QuickAddPreview
						quick={quickAdd.quick}
						newGroup={quickAdd.newGroup}
						currency={quickAdd.newGroup ? DEFAULT_CURRENCY : currency}
						onConfirm={handleSaveQuickAdd}
						onClose={() => setQuickAdd(null)}
					/>
				)}

				<ExpenseViewModal
					isOpen={!!viewingExpenseId}
					expense={viewingExpense || null}
					people={people}
					currency={currency}
					onClose={() => setViewingExpenseId(null)}
					onEdit={() => {
						if (viewingExpense) {
							setViewingExpenseId(null);
							handleStartEditExpense(viewingExpense);
						}
					}}
					onDelete={() => {
						if (viewingExpenseId) {
							handleDeleteExpense(viewingExpenseId);
							setViewingExpenseId(null);
						}
					}}
				/>

				{editingExpenseId && editExpenseData && (
					<ExpenseFormModal
						isOpen={!!editingExpenseId}
						onClose={handleCancelEditExpense}
						onSubmit={handleSaveEditExpense}
						people={people}
						initialAmount={editExpenseData.amount}
						initialPaidBy={editExpenseData.paidBy}
						initialParticipants={editExpenseData.participants}
						initialDescription={editExpenseData.description}
						initialSplitMethod={editExpenseData.splitMethod as any}
						initialWeights={editExpenseData.weights}
						initialDate={editExpenseData.date}
						initialRepeat={editExpenseData.repeat}
						currency={currency}
						title="Edit Expense"
					/>
				)}
			</div>
		</main>
	);
}
