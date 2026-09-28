import { Expense, Group, SplitMethod } from "@/types";

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
    percentages?: Record<string, number>,
    date?: number
  ): boolean => {
    if (amount <= 0 || !paidBy || participants.size === 0 || !currentGroup) {
      return false;
    }

    // Split only among the people ticked: the payer may have paid for others.
    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      amount,
      paidBy,
      participants: Array.from(participants),
      description,
      splitMethod,
      percentages: splitMethod === "percentage" ? percentages : undefined,
      createdAt: date ?? Date.now(),
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
    percentages?: Record<string, number>,
    date?: number
  ): boolean => {
    if (amount <= 0 || !paidBy || participants.size === 0 || !currentGroup) {
      return false;
    }

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
                splitMethod,
                percentages: splitMethod === "percentage" ? percentages : undefined,
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
      id: `payment-${Date.now()}`,
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

