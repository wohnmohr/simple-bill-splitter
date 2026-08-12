"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Tab, Currency, Expense } from "@/types";
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
	} | null>(null);

	const {
		groups,
		selectedGroupId,
		setSelectedGroupId,
		currentGroup,
		createGroup,
		deleteGroup,
		updateGroupCurrency,
		setGroups,
	} = useGroups();

	const { addMember, updateMemberUpi, deleteMember } = useGroupMembers(
		groups,
		setGroups,
		currentGroup
	);

	const { addExpense, updateExpense, deleteExpense } = useExpenses(
		groups,
		setGroups,
		currentGroup
	);

	const people = currentGroup?.members || [];
	const expenses = currentGroup?.expenses || [];
	const balances = calculateBalances(people, expenses);
	const settlements = calculateSettlements(people, expenses);
	const currency = currentGroup?.currency || DEFAULT_CURRENCY;

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
		percentages?: Record<string, number>
	) => {
		addExpense(
			amount,
			paidBy,
			participants,
			description,
			splitMethod as any,
			percentages
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
		});
	};

	const handleSaveEditExpense = (
		amount: number,
		paidBy: string,
		participants: Set<string>,
		description?: string,
		splitMethod?: string,
		percentages?: Record<string, number>
	) => {
		if (editingExpenseId) {
			updateExpense(
				editingExpenseId,
				amount,
				paidBy,
				participants,
				description,
				splitMethod as any,
				percentages
			);
			setEditingExpenseId(null);
			setEditExpenseData(null);
		}
	};

	const handleCancelEditExpense = () => {
		setEditingExpenseId(null);
		setEditExpenseData(null);
	};

	const handleDeleteExpense = (expenseId: string) => {
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

	return (
				<main className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 pb-24 safe-pb">
			<div className="max-w-lg sm:max-w-2xl mx-auto px-4 py-4 sm:py-5">
				<Header />

				{groups.length === 0 ? (
					<EmptyGroupState onCreateGroup={() => setShowGroupForm(true)} />
				) : selectedGroupId === null ? (
					<GroupsHome
						groups={groups}
						onSelectGroup={setSelectedGroupId}
						onDeleteGroup={deleteGroup}
						onCreateGroup={() => setShowGroupForm(true)}
					/>
				) : (
					<>
						<div className="mb-3 sm:mb-4">
							<button
								onClick={() => setSelectedGroupId(null)}
								className="flex items-center gap-1.5 text-sm sm:text-base font-medium text-gray-700 hover:text-indigo-600 active:text-indigo-700 transition-colors touch-manipulation group"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5 sm:h-6 sm:w-6 group-hover:-translate-x-1 transition-transform"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2.5}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M15 19l-7-7 7-7"
									/>
								</svg>
								<span>All groups</span>
							</button>
						</div>
						<GroupSelector
							groups={groups}
							selectedGroupId={selectedGroupId}
							onSelectGroup={setSelectedGroupId}
							onDeleteGroup={deleteGroup}
						/>

						{currentGroup && (
							<>
								<div className="mb-3 sm:mb-4">
									<button
										onClick={() => setShowMembersModal(true)}
										className="w-full min-h-12 px-4 py-3 bg-white border-2 border-indigo-200 text-indigo-800 rounded-2xl font-semibold hover:bg-indigo-50 active:bg-indigo-100 shadow-sm flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
									>
										<Users className="h-5 w-5" />
										<span>
											{currentGroup.members.length === 0
												? "Add members & UPI IDs"
												: `Members (${currentGroup.members.length}) · UPI`}
										</span>
									</button>
								</div>

								{currentGroup.members.length > 0 && (
									<>
										<TabNavigation
											activeTab={activeTab}
											onTabChange={handleTabChange}
										/>

										{activeTab === "transactions" && (
											<ExpenseList
												expenses={expenses}
												people={people}
												currency={currency}
												onExpenseClick={setViewingExpenseId}
												onExpenseEdit={handleStartEditExpense}
												onExpenseDelete={handleDeleteExpense}
											/>
										)}

										{activeTab === "balances" && (
											<BalanceList
												balances={balances}
												people={people}
												currency={currency}
											/>
										)}

										{activeTab === "settlements" && (
											<SettlementList
												settlements={settlements}
												people={people}
												currency={currency}
												groupName={currentGroup.name}
												expenses={expenses}
												onUpdateMemberUpi={updateMemberUpi}
											/>
										)}

										<FloatingActionButton
											onClick={() => setShowExpenseForm(true)}
											showTooltip={expenses.length === 0}
										/>
									</>
								)}
							</>
						)}
					</>
				)}

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
						onDeleteMember={deleteMember}
					/>
				)}

				<ExpenseFormModal
					isOpen={showExpenseForm}
					onClose={() => setShowExpenseForm(false)}
					onSubmit={handleAddExpense}
					people={people}
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
						title="Edit Expense"
					/>
				)}
			</div>
		</main>
	);
}
