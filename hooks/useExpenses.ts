import { Expense, ExpenseComment, Group, SplitChoice } from "@/types";
import { MAX_COMMENT } from "@/utils/groupOps";
import { newId, paymentId } from "@/utils/ids";
import { firstRepeat } from "@/utils/recurring";
import { payerFields, splitFields } from "@/utils/calculations";
import { cleanText } from "@/utils/text";

/** What the expense form produces; the hook stores it as an expense. */
export type ExpenseInput = {
  amount: number;
  /** How much each person paid, by person id. One entry when one person paid. */
  paid: Record<string, number>;
  participants: Set<string>;
  description?: string;
  splitMethod: SplitChoice;
  /** Percentages, exact amounts or shares per person, for those split methods. */
  weights?: Record<string, number>;
  date?: number;
  /** Add it again every month, on the same day. */
  repeatMonthly: boolean;
};

/** The stored fields of an expense, from what was entered. */
const expenseFields = (input: ExpenseInput) => ({
  amount: input.amount,
  ...payerFields(input.paid),
  // Split only among the people ticked: the payer may have paid for others.
  participants: Array.from(input.participants),
  description: input.description ? cleanText(input.description, 100) || undefined : undefined,
  ...splitFields(input.splitMethod, input.weights, input.amount),
});

const isValid = (input: ExpenseInput) =>
  input.amount > 0 && !!payerFields(input.paid).paidBy && input.participants.size > 0;

export const useExpenses = (
  groups: Group[],
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>,
  currentGroup: Group | undefined
) => {
  const addExpense = (input: ExpenseInput): boolean => {
    if (!currentGroup || !isValid(input)) return false;

    const newExpense: Expense = {
      id: newId("expense"),
      ...expenseFields(input),
      createdAt: input.date ?? Date.now(),
      // The first copy is next month's, even for a back-dated expense.
      ...(input.repeatMonthly ? { repeat: { next: firstRepeat(Date.now()) } } : {}),
    };

    const updatedGroups = groups.map((g) =>
      g.id === currentGroup.id
        ? { ...g, expenses: [...g.expenses, newExpense] }
        : g
    );

    setGroups(updatedGroups);
    return true;
  };

  const updateExpense = (expenseId: string, input: ExpenseInput): boolean => {
    if (!currentGroup || !isValid(input)) return false;

    // Keeps its place in the schedule if it already repeated; otherwise the first copy is next month's.
    const repeatFor = (e: Expense) => (input.repeatMonthly ? { repeat: e.repeat ?? { next: firstRepeat(Date.now()) } } : {});

    const updatedGroups = groups.map((g) =>
      g.id === currentGroup.id
        ? {
          ...g,
          expenses: g.expenses.map((e) =>
            e.id === expenseId
              ? {
                id: e.id,
                createdAt: input.date ?? e.createdAt,
                ...expenseFields(input),
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
      // Both people marking the same debt on their own phones record one payment.
      id: paymentId(currentGroup.expenses, from, to, amount),
      amount: Math.round(amount * 100) / 100,
      paidBy: from,
      participants: [to],
      splitMethod: "equally",
      kind: "payment",
      createdAt: Date.now(),
    };
    setGroups((prev) =>
      prev.map((g) =>
        g.id === currentGroup.id && !g.expenses.some((e) => e.id === payment.id)
          ? { ...g, expenses: [...g.expenses, payment] }
          : g
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
          ? {
            ...g,
            expenses: g.expenses.filter((e) => e.id !== expenseId),
            comments: g.comments?.filter((c) => c.expenseId !== expenseId),
          }
          : g
      )
    );
  };

  /** Adds a comment from whoever this device is in the group. */
  const addComment = (expenseId: string, text: string): void => {
    const trimmed = text.trim().slice(0, MAX_COMMENT);
    if (!currentGroup || !trimmed) return;
    const comment: ExpenseComment = {
      id: newId("comment"),
      expenseId,
      text: trimmed,
      at: Date.now(),
      ...(currentGroup.meId ? { by: currentGroup.meId } : {}),
    };
    setGroups((prev) =>
      prev.map((g) =>
        g.id === currentGroup.id ? { ...g, comments: [...(g.comments ?? []), comment] } : g
      )
    );
  };

  return {
    addExpense,
    updateExpense,
    deleteExpense,
    recordPayment,
    restoreExpense,
    addComment,
  };
};

