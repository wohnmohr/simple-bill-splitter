"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@mantine/hooks";
import { ChevronLeft, UserPlus } from "lucide-react";
import { Tab, Currency, Expense, Settlement } from "@/types";
import { DEFAULT_CURRENCY } from "@/constants";
import { calculateBalances, calculateSettlements } from "@/utils/calculations";
import { useGroups } from "@/hooks/useGroups";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useExpenses } from "@/hooks/useExpenses";
import { Header } from "@/components/Header/Header";
import { GroupSelector } from "@/components/Group/GroupSelector";
import { CreateGroupModal } from "@/components/Group/CreateGroupModal";
import { AddMembersModal } from "@/components/Group/AddMembersModal";
import { GroupsHome } from "@/components/Group/GroupsHome";
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

export default function Home() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<Tab>("transactions");
	const [showGroupForm, setShowGroupForm] = useState(false);
	const [showExpenseForm, setShowExpenseForm] = useState(false);
	const [showMembersModal, setShowMembersModal] = useState(false);
	const [viewingExpenseId, setViewingExpenseId] = useState<string | null>(null);
	const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
	const [editExpenseData, setEditExpenseData] = useState<{
		amount: string;
		paidBy: string;
		participants: Set<string>;
		description?: string;
		splitMethod?: string;
		percentages?: Record<string, number>;
		date?: number;
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
		setGroups,
	} = useGroups();

	const { addMember, updateMemberUpi, deleteMember } = useGroupMembers(
		groups,
		setGroups,
		currentGroup
	);

	const { addExpense, updateExpense, deleteExpense, recordPayment } = useExpenses(
		groups,
		setGroups,
		currentGroup
	);

	const people = currentGroup?.members || [];
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
		percentages?: Record<string, number>,
		date?: number
	) => {
		addExpense(
			amount,
			paidBy,
			participants,
			description,
			splitMethod as any,
			percentages,
			date
		);
		track("dashboard_expense_added", {
			participant_count: participants.size,
			split_method: splitMethod || "equally",
			currency: currency.code,
		});
		setShowExpenseForm(false);
	};

	const handleAddMember = (memberName: string, upiId?: string) => {
		const ok = addMember(memberName, upiId);
		if (ok) track("dashboard_member_added");
		return ok;
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
			percentages: expense.percentages,
			date: expense.createdAt,
		});
	};

	const handleSaveEditExpense = (
		amount: number,
		paidBy: string,
		participants: Set<string>,
		description?: string,
		splitMethod?: string,
		percentages?: Record<string, number>,
		date?: number
	) => {
		if (editingExpenseId) {
			updateExpense(
				editingExpenseId,
				amount,
				paidBy,
				participants,
				description,
				splitMethod as any,
				percentages,
				date
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
			<div
				className={`w-full mx-auto px-4 py-3 sm:py-5 min-w-0 ${
					selectedGroupId && inGroup ? "max-w-2xl lg:max-w-5xl lg:px-6" : "max-w-2xl"
				}`}
			>
				<Header
					onFeedback={() => {
						track("feedback_opened", { source: "header" });
						setShowFeedback(true);
					}}
				/>

				{groups.length === 0 ? (
					<EmptyGroupState onCreateGroup={() => setShowGroupForm(true)} />
				) : selectedGroupId === null ? (
					<GroupsHome
						groups={groups}
						onSelectGroup={setSelectedGroupId}
						onDeleteGroup={handleDeleteGroup}
						onCreateGroup={() => setShowGroupForm(true)}
					/>
				) : (
					<div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
					<div className="min-w-0">
						<button
							onClick={() => setSelectedGroupId(null)}
							className="btn-ghost -ml-2.5 mb-2"
						>
							<ChevronLeft className="h-4 w-4" />
							All groups
						</button>
						<GroupSelector
							groups={groups}
							selectedGroupId={selectedGroupId}
							onSelectGroup={setSelectedGroupId}
							onDeleteGroup={handleDeleteGroup}
							onManageMembers={() => setShowMembersModal(true)}
							onChangeMe={() => {
								if (!currentGroup) return;
								setGroupMe(currentGroup.id, undefined);
								handleTabChange("settlements");
							}}
						/>

						{currentGroup && (
							<>
								{currentGroup.members.length === 0 && (
									<div className="surface px-6 py-10 text-center">
										<p className="font-semibold text-ink">Who&apos;s in this group?</p>
										<p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">
											Add everyone who shares costs. You can add UPI IDs now
											or when it&apos;s time to settle.
										</p>
										<button
											onClick={() => setShowMembersModal(true)}
											className="btn-primary mt-5"
										>
											<UserPlus className="h-4 w-4" />
											Add members
										</button>
									</div>
								)}

								{currentGroup.members.length > 0 && (
									<>
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
											<ExpenseList
												expenses={expenses}
												people={people}
												currency={currency}
												onExpenseClick={setViewingExpenseId}
												onExpenseEdit={handleStartEditExpense}
												onExpenseDelete={handleDeleteExpense}
											/>
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

										<FloatingActionButton
											onClick={() => setShowExpenseForm(true)}
											showTooltip={expenses.length === 0}
										/>
									</>
								)}
							</>
						)}
					</div>

					{isWide && inGroup && currentGroup && (
						<aside className="sticky top-5 mt-[3.25rem]" aria-labelledby="balances-heading">
							<h2 id="balances-heading" className="label-text mb-2 px-1">
								Balances
							</h2>
							<BalanceList balances={balances} people={people} currency={currency} />
						</aside>
					)}
					</div>
				)}

				<Toast
					toast={toast}
					onDismiss={dismissToast}
					raised={!!currentGroup && currentGroup.members.length > 0}
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
					<AddMembersModal
						isOpen={showMembersModal}
						onClose={() => setShowMembersModal(false)}
						group={currentGroup}
						onAddMember={handleAddMember}
						onUpdateMemberUpi={updateMemberUpi}
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
						initialPercentages={editExpenseData.percentages}
						initialDate={editExpenseData.date}
						currency={currency}
						title="Edit Expense"
					/>
				)}
			</div>
		</main>
	);
}
