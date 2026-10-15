import { Expense, Group, SplitMethod } from "@/types";
import { newId } from "@/utils/ids";
import { firstRepeat } from "@/utils/recurring";

/** A custom split is stored in the field its method reads: percentages or exact amounts. */
const splitFields = (splitMethod: SplitMethod, weights?: Record<string, number>) => ({
  splitMethod,
  percentages: splitMethod === "percentage" ? weights : undefined,
  amounts: splitMethod === "exact" ? weights : undefined,
});

export const useExpenses = (
  groups: Group[],
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>,
  currentGroup: Group | undefined
) => {
  const addExpense = (
    amount: number,
    paidBy: string,
    participants: Set<string>,
    description?: string,
    splitMethod: SplitMethod = "equally",
    weights?: Record<string, number>,
    date?: number,
    repeatMonthly = false
  ): boolean => {
    if (amount <= 0 || !paidBy || participants.size === 0 || !currentGroup) {
      return false;
    }

    // Split only among the people ticked: the payer may have paid for others.
    const newExpense: Expense = {
      id: newId("expense"),
      amount,
      paidBy,
      participants: Array.from(participants),
      description,
      ...splitFields(splitMethod, weights),
      createdAt: date ?? Date.now(),
      // The first copy is next month's, even for a back-dated expense.
      ...(repeatMonthly ? { repeat: { next: firstRepeat(Date.now()) } } : {}),
    };

    const updatedGroups = groups.map((g) =>
      g.id === currentGroup.id
        ? { ...g, expenses: [...g.expenses, newExpense] }
        : g
    );

    setGroups(updatedGroups);
    return true;
  };

  const updateExpense = (
    expenseId: string,
    amount: number,
    paidBy: string,
    participants: Set<string>,
    description?: string,
    splitMethod: SplitMethod = "equally",
    weights?: Record<string, number>,
    date?: number,
    repeatMonthly = false
  ): boolean => {
    if (amount <= 0 || !paidBy || participants.size === 0 || !currentGroup) {
      return false;
    }

    // Keeps its place in the schedule if it already repeated; otherwise the first copy is next month's.
    const repeatFor = (e: Expense) => (repeatMonthly ? { repeat: e.repeat ?? { next: firstRepeat(Date.now()) } } : {});

    const updatedGroups = groups.map((g) =>
      g.id === currentGroup.id
        ? {
          ...g,
          expenses: g.expenses.map((e) =>
            e.id === expenseId
              ? {
                id: e.id,
                createdAt: date ?? e.createdAt,
                amount,
                paidBy,
                participants: Array.from(participants),
                description,
                ...splitFields(splitMethod, weights),
                ...repeatFor(e),
              }
              : e
          ),
        }
        : g
    );

    setGroups(updatedGroups);
    return true;
  };

  /** Records that `from` paid `to` back. Balances shift by exactly `amount`. */
  const recordPayment = (from: string, to: string, amount: number): string | null => {
    if (!currentGroup || amount <= 0 || from === to) return null;
    const payment: Expense = {
      id: newId("payment"),
      amount: Math.round(amount * 100) / 100,
      paidBy: from,
      participants: [to],
      splitMethod: "equally",
      kind: "payment",
      createdAt: Date.now(),
    };
    setGroups((prev) =>
      prev.map((g) =>
        g.id === currentGroup.id ? { ...g, expenses: [...g.expenses, payment] } : g
      )
    );
    return payment.id;
  };

  /** Puts a previously removed entry back (used by undo). */
  const restoreExpense = (expense: Expense): void => {
    if (!currentGroup) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === currentGroup.id && !g.expenses.some((e) => e.id === expense.id)
          ? { ...g, expenses: [...g.expenses, expense] }
          : g
      )
    );
  };

  const deleteExpense = (expenseId: string): void => {
    if (!currentGroup) return;

    const groupId = currentGroup.id;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, expenses: g.expenses.filter((e) => e.id !== expenseId) }
          : g
      )
    );
  };

  return {
    addExpense,
    updateExpense,
    deleteExpense,
    recordPayment,
    restoreExpense,
  };
};

