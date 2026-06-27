"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Tab, Currency, Expense } from "@/types";
import { CURRENCIES } from "@/constants";
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

	const { addMember, deleteMember } = useGroupMembers(
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
	const currency = currentGroup?.currency || CURRENCIES[0];

	const handleCreateGroup = (name: string, currency: Currency) => {
		createGroup(name, currency);
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
		setShowExpenseForm(false);
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
		<main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-20 sm:pb-24">
			<div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
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
								<div className="mb-4 sm:mb-6">
									<button
										onClick={() => setShowMembersModal(true)}
										className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
									>
										<Users className="h-5 w-5 sm:h-6 sm:w-6" />
										<span>
											{currentGroup.members.length === 0
												? "Add Members"
												: `Manage Members (${currentGroup.members.length})`}
										</span>
									</button>
								</div>

								{currentGroup.members.length > 0 && (
									<>
										<TabNavigation
											activeTab={activeTab}
											onTabChange={setActiveTab}
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
						onAddMember={addMember}
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
