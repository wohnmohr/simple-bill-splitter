"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@mantine/hooks";
import { Link2, Plus, UserPlus } from "lucide-react";
import { Tab, Currency, Expense, Group, Settlement, SplitChoice } from "@/types";
import { CURRENCIES, DEFAULT_CURRENCY, MAX_GROUPS } from "@/constants";
import { calculateBalances, calculateSettlements, enteredWeights, minorUnits, splitChoice } from "@/utils/calculations";
import { useGroups } from "@/hooks/useGroups";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useBackClose } from "@/hooks/useBackClose";
import { type ExpenseInput, useExpenses } from "@/hooks/useExpenses";
import { Header } from "@/components/Header/Header";
import { GroupSelector } from "@/components/Group/GroupSelector";
import { CreateGroupModal } from "@/components/Group/CreateGroupModal";
import { AddMembersModal } from "@/components/Group/AddMembersModal";
import { GroupsHome, GroupsSkeleton } from "@/components/Group/GroupsHome";
import { SyncModal } from "@/components/Group/SyncModal";
import { ThemeModal } from "@/components/Group/ThemeModal";
import { IdentitySheet } from "@/components/Group/IdentitySheet";
import { InviteNudge } from "@/components/Group/InviteNudge";
import { TripCard } from "@/components/Group/TripCard";
import { shownMembers } from "@/utils/identity";
import { canSetUpi, currentMembers, entriesWith, isOnEntry } from "@/utils/members";
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
import { ConfirmDialog, ConfirmState } from "@/components/UI/ConfirmDialog";
import { Modal } from "@/components/UI/Modal";
import { FeedbackForm } from "@/components/Feedback/FeedbackForm";
import { SettledFeedbackCard } from "@/components/Feedback/SettledFeedbackCard";
import { collectFeedbackContext } from "@/lib/feedbackContext";
import { formatCurrency } from "@/utils/formatting";
import { nextPaymentUndo, type PaymentUndo } from "@/utils/paymentUndo";
import { putBack, undoDeleteExpense, undoRemoveMember } from "@/utils/undo";
import { track } from "@/lib/analytics";
import { consumeOpenOnSettleUp } from "@/utils/shareImport";
import { parseQuickAdd, resolveQuickAdd, type QuickResolved } from "@/utils/quickAdd";
import { applyQuickAdd } from "@/utils/quickAddSave";
import { loadMyName, rememberMyName, withMyName } from "@/utils/myName";
import { takeQuickAdd } from "@/utils/quickAddHandoff";
import { firstExpense, type FirstExpenseInput } from "@/utils/firstExpense";
import { latestGroup, takeLaunch, takeSharedBill } from "@/utils/launch";
import { QuickAddBox } from "@/components/QuickAdd/QuickAddBox";
import { QuickAddPreview } from "@/components/QuickAdd/QuickAddPreview";

/** A new group from a typed sentence is in the currency it was written in ("$50"), else rupees. */
const quickCurrency = (quick: QuickResolved) => CURRENCIES.find((c) => c.code === quick.currency) ?? DEFAULT_CURRENCY;

export default function Home() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<Tab>("transactions");
	// Arrived from a payment reminder: start on what you owe.
	useEffect(() => {
		if (consumeOpenOnSettleUp()) setActiveTab("settlements");
	}, []);

	const [showGroupForm, setShowGroupForm] = useState(false);
	/** "Start the next one": a new group with this group's people. */
	const [nextFrom, setNextFrom] = useState<Group | null>(null);
	const [showExpenseForm, setShowExpenseForm] = useState(false);
	/** A screenshot shared into the app, for Add expense to scan. */
	const [sharedBill, setSharedBill] = useState<File | null>(null);
	const closeExpenseForm = () => {
		setShowExpenseForm(false);
		setSharedBill(null);
	};
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
	/** What the delete prompt is asking about. */
	const [deleting, setDeleting] = useState<{ kind: "group" | "member" | "expense"; id: string } | null>(null);
	const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
	const [editExpenseData, setEditExpenseData] = useState<{
		amount: string;
		paidBy: string;
		payers?: Record<string, number>;
		participants: Set<string>;
		description?: string;
		splitMethod: SplitChoice;
		weights?: Record<string, number>;
		date?: number;
		repeat: boolean;
	} | null>(null);

	const {
		loaded,
		groups,
		selectedGroupId,
		setSelectedGroupId,
		currentGroup,
		createGroup,
		deleteGroup,
		updateGroupCurrency,
		renameGroup,
		setGroupMe,
		setGroupTheme,
		setGroupClosed,
		setGroups,
		sync,
		backup,
	} = useGroups();

	// An open group paints the whole page (modals included) in its theme;
	// the group list and the rest of the site keep SplitBiller's colors.
	const openTheme = selectedGroupId ? currentGroup?.theme : undefined;
	useEffect(() => applyTheme(openTheme), [openTheme]);
	useEffect(() => () => applyTheme(undefined), []);
	// Back from a group goes to the group list (after closing any sheet on top).
	useBackClose(selectedGroupId !== null, () => setSelectedGroupId(null), true);

	const { addMember, updateMemberUpi, renameMember, markJoined, setNickname, deleteMember, bringBackMember } = useGroupMembers(setGroups, currentGroup);

	const { addExpense, updateExpense, deleteExpense, recordPayment, addComment } = useExpenses(
		groups,
		setGroups,
		currentGroup
	);

	// Display names: this device's private nicknames in place of shared names.
	const people = currentGroup ? shownMembers(currentGroup) : [];
	// Who new expenses can include: people who left stay on past entries only.
	const current = currentMembers(people);
	const expenses = currentGroup?.expenses || [];
	const currency = currentGroup?.currency || DEFAULT_CURRENCY;
	const balances = calculateBalances(people, expenses, minorUnits(currency));
	const settlements = calculateSettlements(people, expenses, minorUnits(currency));

	const [toast, setToast] = useState<ToastState>(null);
	const [showFeedback, setShowFeedback] = useState(false);
	const dismissToast = useCallback(() => setToast(null), []);

	const nameOf = (id: string) => people.find((p) => p.id === id)?.name || "Unknown";

	const paymentUndo = useRef<PaymentUndo | null>(null);
	const handleRecordPayments = (list: Settlement[]) => {
		const added = list.flatMap((s) => recordPayment(s.from, s.to, s.amount) ?? []);
		if (!added.length || !currentGroup) return;
		const undo = nextPaymentUndo(paymentUndo.current, toast?.id, currentGroup.id, added, Date.now());
		paymentUndo.current = undo;
		const [s] = list;
		setToast({
			id: undo.toastId,
			message: undo.ids.length === 1
				? `${nameOf(s.from)} paid ${nameOf(s.to)} ${formatCurrency(s.amount, currency)}`
				: `${undo.ids.length} payments marked paid`,
			actionLabel: "Undo",
			onAction: () => undo.ids.forEach((id) => deleteExpense(id)),
		});
	};

	// New expenses default to the viewer, else whoever paid most recently.
	const lastPayer = [...expenses].reverse().find((e) => e.kind !== "payment" && current.some((p) => p.id === e.paidBy))?.paidBy;
	const defaultPayerId = currentGroup?.meId || lastPayer;

	const handleCreateGroup = (name: string, currency: Currency) => {
		// The next trip brings the same people (and who you are), not their joins or the old link.
		const from = nextFrom;
		const ok = createGroup(name, currency, from ? (g) => ({
			...g,
			members: currentMembers(from.members).map(({ id, name, upiId }) => ({ id, name, ...(upiId ? { upiId } : {}) })),
			...(from.meId ? { meId: from.meId } : {}),
			...(from.theme ? { theme: from.theme } : {}),
		}) : undefined);
		if (ok) {
			track(from ? "group_next_started" : "dashboard_group_created", { currency: currency.code });
			// A brand-new group needs its people before anything else, so go straight there.
			if (!from) setShowMembersModal(true);
		}
		setShowGroupForm(false);
		setNextFrom(null);
	};

	const closeGroup = (closed: boolean) => {
		if (!currentGroup) return;
		setGroupClosed(currentGroup.id, closed ? Date.now() : undefined);
		track(closed ? "group_closed" : "group_reopened", { synced: !!currentGroup.sync });
	};

	const tripCard = currentGroup && (
		<TripCard
			group={currentGroup}
			onClose={() => closeGroup(true)}
			onReopen={() => closeGroup(false)}
			onStartNext={() => setNextFrom(currentGroup)}
		/>
	);

	const handleAddExpense = (input: ExpenseInput) => {
		addExpense(input);
		track("dashboard_expense_added", {
			participant_count: input.participants.size,
			payer_count: Object.keys(input.paid).length,
			split_method: input.splitMethod,
			currency: currency.code,
			repeats: input.repeatMonthly,
		});
		closeExpenseForm();
	};

	// Quick add reads the sentence on this device; analytics get counts only, never what was typed.
	const handleQuickAdd = (text: string, newGroup: boolean) => {
		const group = newGroup ? undefined : currentGroup;
		const members = group ? currentMembers(shownMembers(group)) : [];
		const quick = withMyName(resolveQuickAdd(parseQuickAdd(text, members.map((m) => m.name)), members, group?.meId, group?.currency.code), loadMyName());
		if (!quick.expenses.length) return;
		track("quick_add_previewed", {
			expense_count: quick.expenses.length,
			unsure_count: quick.expenses.reduce((n, e) => n + e.unsure.length, 0),
			new_group: newGroup,
		});
		setQuickAdd({ quick, newGroup });
	};

	// Opened from the home-screen shortcut, or by sharing a screenshot to the installed app:
	// straight to Add expense in the group you used last (or the first-run form if there's none).
	useEffect(() => {
		if (!loaded) return;
		const launch = takeLaunch();
		const group = launch && latestGroup(groups);
		if (!group) return;
		setSelectedGroupId(group.id);
		setShowExpenseForm(true);
		if (launch === "shared") void takeSharedBill().then(setSharedBill);
		track("app_launched_to_add", { shared: launch === "shared" });
	}, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

	// Installed on the home screen: the service worker receives shared screenshots.
	useEffect(() => {
		if (window.matchMedia("(display-mode: standalone)").matches) navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
	}, []);

	// Typed on the home page: preview it as a new group straight away.
	useEffect(() => {
		const text = takeQuickAdd();
		if (text) handleQuickAdd(text, true);
	}, []);

	const handleSaveQuickAdd = (quick: QuickResolved, groupName: string, edited: boolean) => {
		if (!quickAdd) return;
		const fill = (g: Group) => applyQuickAdd(g, quick);
		const me = quick.people.find((p) => p.isMe && p.isNew);
		if (me) rememberMyName(me.name);
		if (quickAdd.newGroup) {
			// At the group limit nothing is made: say so, and keep the preview so the typed bill isn't lost.
			if (!createGroup(groupName, quickCurrency(quick), fill)) {
				setToast({ id: Date.now(), message: `You already have ${MAX_GROUPS} groups. Delete one, then try again.` });
				return;
			}
		} else if (currentGroup) setGroups((prev) => prev.map((g) => (g.id === currentGroup.id ? fill(g) : g)));
		track("quick_add_saved", { expense_count: quick.expenses.length, edited, new_group: quickAdd.newGroup });
		setQuickAdd(null);
		setQuickAddSaves((n) => n + 1);
	};

	// The first run's form: the group is made around its first expense, named after it.
	const handleFirstExpense = (input: FirstExpenseInput) => {
		const ok = createGroup(input.description || "Shared expenses", DEFAULT_CURRENCY, (g) => applyQuickAdd(g, firstExpense(input)));
		if (!ok) return;
		rememberMyName(input.myName);
		track("first_expense_added", { participant_count: input.others.length + 1 });
	};

	const handleAddMembers = (names: string[], upiId?: string) => {
		if (!currentGroup) return;
		// The first person added to a new group is the one setting it up, so they're
		// the default payer from the first expense on (the form asks for "Your name").
		const firstIsMe = currentGroup.members.length === 0 && currentGroup.meId === undefined;
		names.forEach((name, i) => {
			const id = addMember(name, upiId);
			if (!id) return;
			track("dashboard_member_added");
			if (firstIsMe && i === 0) {
				rememberMyName(name);
				setGroupMe(currentGroup.id, id);
				markJoined(id);
			}
		});
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
			payers: expense.payers,
			participants: new Set(expense.participants),
			description: expense.description,
			splitMethod: splitChoice(expense) || "equally",
			weights: enteredWeights(expense),
			date: expense.createdAt,
			repeat: !!expense.repeat,
		});
	};

	const handleSaveEditExpense = (input: ExpenseInput) => {
		if (editingExpenseId) {
			updateExpense(editingExpenseId, input);
			setEditingExpenseId(null);
			setEditExpenseData(null);
		}
	};

	const handleCancelEditExpense = () => {
		setEditingExpenseId(null);
		setEditExpenseData(null);
	};

	/**
	 * Every delete happens immediately and offers Undo, which takes back only
	 * that delete (utils/undo): anything changed since stays.
	 */
	const offerUndo = (message: string, undo: (groups: Group[]) => Group[], afterUndo?: () => void) => {
		setToast({
			id: Date.now(),
			message,
			actionLabel: "Undo",
			onAction: () => {
				setGroups(undo);
				afterUndo?.();
			},
		});
	};

	/** Undo for a change inside one group, given the group as it was before. */
	const offerGroupUndo = (message: string, before: Group, undo: (group: Group, before: Group) => Group) =>
		offerUndo(message, (prev) => prev.map((g) => (g.id === before.id ? undo(g, before) : g)));

	const handleDeleteGroup = (groupId: string) => {
		const index = groups.findIndex((g) => g.id === groupId);
		const group = groups[index];
		if (!group) return;
		const wasOpen = selectedGroupId === groupId;
		offerUndo(`Deleted ${group.name}`, (prev) => putBack(prev, group, index), () => {
			if (wasOpen) setSelectedGroupId(groupId);
		});
		deleteGroup(groupId);
		if (wasOpen) setSelectedGroupId(null);
	};

	const handleDeleteMember = (personId: string) => {
		if (!currentGroup) return;
		offerGroupUndo(`Removed ${nameOf(personId)}`, currentGroup, (g, before) => undoRemoveMember(g, before, personId));
		deleteMember(personId);
	};

	const handleDeleteExpense = (expenseId: string) => {
		const expense = expenses.find((e) => e.id === expenseId);
		if (currentGroup && expense) {
			offerGroupUndo(
				expense.kind === "payment"
					? `Deleted payment from ${nameOf(expense.paidBy)}`
					: `Deleted ${expense.description || "expense"}`,
				currentGroup,
				(g, before) => undoDeleteExpense(g, before, expenseId)
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
	// Editing keeps whoever is already on the entry, even if they've left since.
	const editingExpense = expenses.find((e) => e.id === editingExpenseId);
	const editPeople = people.filter((p) => !p.left || (editingExpense && isOnEntry(editingExpense, p.id)));

	/** Every delete asks first. Built each render so it acts on the latest data. */
	const deletePrompt = (): ConfirmState => {
		if (deleting?.kind === "group") {
			const group = groups.find((g) => g.id === deleting.id);
			if (!group) return null;
			const onConfirm = () => handleDeleteGroup(group.id);
			return group.sync
				? { title: `Remove ${group.name} from this device?`, detail: "Everyone else keeps it.", action: "Remove", onConfirm }
				: { title: `Delete ${group.name}?`, detail: "All its expenses go with it.", action: "Delete", onConfirm };
		}
		if (deleting?.kind === "member") {
			const involved = entriesWith(expenses, deleting.id);
			return {
				title: `Remove ${nameOf(deleting.id)}?`,
				detail: involved > 0
					? `They stay on the ${involved === 1 ? "entry" : `${involved} entries`} they were in and in balances, but won't be on new expenses.`
					: undefined,
				action: "Remove",
				onConfirm: () => handleDeleteMember(deleting.id),
			};
		}
		const expense = deleting && expenses.find((e) => e.id === deleting.id);
		if (!expense) return null;
		return {
			title: expense.kind === "payment"
				? `Delete payment from ${nameOf(expense.paidBy)}?`
				: `Delete ${expense.description || "this expense"}?`,
			detail: currentGroup?.sync ? "It goes for everyone in the group." : undefined,
			action: "Delete",
			onConfirm: () => handleDeleteExpense(expense.id),
		};
	};
	const askDeleteGroup = (id: string) => setDeleting({ kind: "group", id });

	// On wide screens Balances lives in a side panel, so it leaves the tab bar.
	const isWide = useMediaQuery("(min-width: 1024px)") ?? false;
	const inGroup = !!currentGroup && currentGroup.members.length > 0;
	// A closed group is a record: no new expenses until it's reopened. Nor when everyone has left: there's nobody to add one for.
	const canAdd = inGroup && current.length > 0 && !currentGroup.closedAt;
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

				{/* Until this device's groups are read, show their shape, not the first-run screen. */}
				{!loaded ? (
					<GroupsSkeleton />
				) : groups.length === 0 ? (
					<EmptyGroupState
						onFirstExpense={handleFirstExpense}
						onCreateGroup={() => setShowGroupForm(true)}
						quickAdd={<QuickAddBox key={quickAddSaves} label="Describe a shared expense" onSubmit={(t) => handleQuickAdd(t, true)} />}
					/>
				) : selectedGroupId === null ? (
					<GroupsHome
						groups={groups}
						onSelectGroup={setSelectedGroupId}
						onDeleteGroup={askDeleteGroup}
						onCreateGroup={() => setShowGroupForm(true)}
						quickAdd={<QuickAddBox key={quickAddSaves} label="Start a group by describing an expense" onSubmit={(t) => handleQuickAdd(t, true)} />}
						backup={backup}
					/>
				) : (
					<>
					<div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
					<div className="min-w-0">
						{currentGroup && (
							<>
								<GroupSelector
									group={currentGroup}
									onBack={() => setSelectedGroupId(null)}
									onDeleteGroup={askDeleteGroup}
									onManageMembers={() => setShowMembersModal(true)}
									onShare={() => setShowSync(true)}
									onTheme={() => setShowTheme(true)}
									onRename={(name) => renameGroup(currentGroup.id, name)}
									syncStatus={sync.status[currentGroup.id]}
									onChangeMe={() => setIdentityAsk("pick")}
								/>

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
										{!currentGroup.closedAt &&
											currentGroup.members.length > 1 &&
											expenses.some((e) => e.kind !== "payment") && (
												<InviteNudge
													group={currentGroup}
													shareLink={async () => currentGroup.sync ?? sync.enableSync(currentGroup)}
													onInvite={startInvite}
												/>
											)}

										{currentGroup.closedAt && <div className="mb-3">{tripCard}</div>}

										<TabNavigation
											activeTab={shownTab}
											onTabChange={handleTabChange}
											hideBalances={isWide}
											counts={{
												transactions: expenses.filter((e) => e.kind !== "payment").length,
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
											{canAdd && <div className="mb-3">
												<QuickAddBox
													key={quickAddSaves}
													label="Add an expense by typing it"
													compact
													memberNames={current.filter((p) => p.id !== currentGroup?.meId).map((p) => p.name)}
													onSubmit={(t) => handleQuickAdd(t, false)}
												/>
											</div>}
											<ExpenseList
												expenses={expenses}
												comments={currentGroup.comments}
												people={people}
												currency={currency}
												meId={currentGroup.meId}
												onExpenseClick={setViewingExpenseId}
												onExpenseEdit={handleStartEditExpense}
												onExpenseDelete={(id) => setDeleting({ kind: "expense", id })}
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
												canSetUpi={(id) => canSetUpi(currentGroup, id)}
												meId={currentGroup.meId}
												sharePeople={currentGroup.members}
												syncLink={currentGroup.sync}
												onSetMe={(id) => setGroupMe(currentGroup.id, id)}
												onRecordPayment={handleRecordPayments}
												settledSlot={
													<>
													{!currentGroup.closedAt && expenses.some((e) => e.kind !== "payment") && tripCard}
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
													</>
												}
											/>
										)}
										</div>

										{/* On wide screens "Add expense" sits at the top of the side panel instead. */}
										{!isWide && canAdd && (
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
							{canAdd && (
								<button onClick={() => setShowExpenseForm(true)} className="btn-primary w-full !py-3 !text-base">
									<Plus className="h-5 w-5" strokeWidth={2.5} />
									Add expense
								</button>
							)}
							<h2 id="balances-heading" className="label-text px-1 pt-2">
								Balances
							</h2>
							<BalanceList balances={balances} people={people} currency={currency} />
						</aside>
					)}
					</div>
					</>
				)}

				<ConfirmDialog confirm={deletePrompt()} onClose={() => setDeleting(null)} />

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
					isOpen={showGroupForm || !!nextFrom}
					onClose={() => {
						setShowGroupForm(false);
						setNextFrom(null);
					}}
					onCreate={handleCreateGroup}
					groupCount={groups.length}
					note={nextFrom ? `With the same people: ${new Intl.ListFormat("en-IN").format(currentMembers(shownMembers(nextFrom)).map((m) => m.name))}.` : undefined}
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
						onAddMembers={handleAddMembers}
						onUpdateMemberUpi={updateMemberUpi}
						onRenameMember={renameMember}
						onSetNickname={setNickname}
						onDeleteMember={(id) => setDeleting({ kind: "member", id })}
						onBringBackMember={bringBackMember}
					/>
				)}

				<ExpenseFormModal
					isOpen={showExpenseForm}
					onClose={closeExpenseForm}
					onSubmit={handleAddExpense}
					people={current}
					history={expenses}
					currency={currency}
					defaultPayerId={defaultPayerId}
					scanFile={sharedBill}
				/>

				{quickAdd && (
					<QuickAddPreview
						quick={quickAdd.quick}
						newGroup={quickAdd.newGroup}
						currency={quickAdd.newGroup ? quickCurrency(quickAdd.quick) : currency}
						onConfirm={handleSaveQuickAdd}
						onClose={() => setQuickAdd(null)}
					/>
				)}

				<ExpenseViewModal
					key={viewingExpenseId ?? ""}
					isOpen={!!viewingExpenseId}
					expense={viewingExpense || null}
					people={people}
					currency={currency}
					comments={currentGroup?.comments?.filter((c) => c.expenseId === viewingExpenseId) ?? []}
					meId={currentGroup?.meId}
					onComment={(text) => {
						if (!viewingExpenseId) return;
						addComment(viewingExpenseId, text);
						track("expense_comment_added", { synced: !!currentGroup?.sync });
					}}
					onClose={() => setViewingExpenseId(null)}
					onEdit={() => {
						if (viewingExpense) {
							setViewingExpenseId(null);
							handleStartEditExpense(viewingExpense);
						}
					}}
					onDelete={() => viewingExpenseId && setDeleting({ kind: "expense", id: viewingExpenseId })}
				/>

				{editingExpenseId && editExpenseData && (
					<ExpenseFormModal
						isOpen={!!editingExpenseId}
						onClose={handleCancelEditExpense}
						onSubmit={handleSaveEditExpense}
						people={editPeople}
						initialAmount={editExpenseData.amount}
						initialPaidBy={editExpenseData.paidBy}
						initialPayers={editExpenseData.payers}
						initialParticipants={editExpenseData.participants}
						initialDescription={editExpenseData.description}
						initialSplitMethod={editExpenseData.splitMethod}
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
