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
    percentages?: Record<string, number>
  ): boolean => {
    if (amount <= 0 || !paidBy || participants.size === 0 || !currentGroup) {
      return false;
    }

    const participantSet = new Set(participants);
    participantSet.add(paidBy);

    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      amount,
      paidBy,
      participants: Array.from(participantSet),
      description,
      splitMethod,
      percentages: splitMethod === "percentage" ? percentages : undefined,
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
    percentages?: Record<string, number>
  ): boolean => {
    if (amount <= 0 || !paidBy || participants.size === 0 || !currentGroup) {
      return false;
    }

    const participantSet = new Set(participants);
    participantSet.add(paidBy);

    const updatedGroups = groups.map((g) =>
      g.id === currentGroup.id
        ? {
          ...g,
          expenses: g.expenses.map((e) =>
            e.id === expenseId
              ? {
                id: e.id,
                amount,
                paidBy,
                participants: Array.from(participantSet),
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

  const deleteExpense = (expenseId: string): void => {
    if (!currentGroup) return;

    const updatedGroups = groups.map((g) =>
      g.id === currentGroup.id
        ? { ...g, expenses: g.expenses.filter((e) => e.id !== expenseId) }
        : g
    );

    setGroups(updatedGroups);
  };

  return {
    addExpense,
    updateExpense,
    deleteExpense,
  };
};

