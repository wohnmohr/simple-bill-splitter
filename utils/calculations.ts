import type { Expense, Person, Balance, Settlement, SplitMethod } from "@/types";

/** A custom split is stored in the field its method reads: percentages or exact amounts. */
export const splitFields = (splitMethod: SplitMethod, weights?: Record<string, number>) => ({
  splitMethod,
  percentages: splitMethod === "percentage" ? weights : undefined,
  amounts: splitMethod === "exact" ? weights : undefined,
});

/** The custom split an expense carries: percentages or exact amounts, per person. */
export const splitWeights = (expense: Expense): Record<string, number> | undefined =>
  expense.splitMethod === "percentage"
    ? expense.percentages
    : expense.splitMethod === "exact"
      ? expense.amounts
      : undefined;

/** Who paid for an expense, and how much each. */
export const expensePayers = (expense: Expense): Map<string, number> =>
  new Map(expense.payers ? Object.entries(expense.payers) : [[expense.paidBy, expense.amount]]);

/**
 * Stores who paid from what each person put in: one payer is just `paidBy`;
 * several keep `payers`, with the biggest as `paidBy`.
 */
export const payerFields = (paid: Record<string, number>): Pick<Expense, "paidBy" | "payers"> => {
  const ranked = Object.entries(paid).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  return { paidBy: ranked[0]?.[0] ?? "", payers: ranked.length > 1 ? Object.fromEntries(ranked) : undefined };
};

/**
 * What each participant owes for an expense. Percentages and exact amounts
 * are both weights, scaled so the shares always add up to the amount; with
 * no usable weights the expense is split equally.
 */
export const expenseShares = (expense: Expense): Map<string, number> => {
  const weights = splitWeights(expense);
  const total = weights
    ? expense.participants.reduce((sum, id) => sum + (weights[id] || 0), 0)
    : 0;
  return new Map(
    expense.participants.map((id) => [
      id,
      total > 0
        ? (expense.amount * (weights![id] || 0)) / total
        : expense.amount / expense.participants.length,
    ])
  );
};

export const calculateBalances = (
  people: Person[],
  expenses: Expense[]
): Balance[] => {
  const balances: Map<string, number> = new Map();

  people.forEach((person) => {
    balances.set(person.id, 0);
  });

  expenses.forEach((expense) => {
    expenseShares(expense).forEach((share, participantId) => {
      balances.set(participantId, (balances.get(participantId) || 0) - share);
    });

    expensePayers(expense).forEach((paid, payerId) => {
      balances.set(payerId, (balances.get(payerId) || 0) + paid);
    });
  });

  return Array.from(balances.entries()).map(([personId, balance]) => ({
    personId,
    balance: Math.round(balance * 100) / 100,
  }));
};

export const calculateSettlements = (
  people: Person[],
  expenses: Expense[]
): Settlement[] => {
  const balances = calculateBalances(people, expenses);
  const settlements: Settlement[] = [];

  const creditors = balances
    .filter((b) => b.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  const debtors = balances
    .filter((b) => b.balance < 0)
    .sort((a, b) => a.balance - b.balance);

  const creditorBalances = new Map(
    creditors.map((c) => [c.personId, c.balance])
  );
  const debtorBalances = new Map(
    debtors.map((d) => [d.personId, Math.abs(d.balance)])
  );

  while (creditorBalances.size > 0 && debtorBalances.size > 0) {
    const largestCreditor = Array.from(creditorBalances.entries()).reduce(
      (a, b) => (a[1] > b[1] ? a : b)
    );
    const largestDebtor = Array.from(debtorBalances.entries()).reduce(
      (a, b) => (a[1] > b[1] ? a : b)
    );

    const [creditorId, creditorAmount] = largestCreditor;
    const [debtorId, debtorAmount] = largestDebtor;

    const settlementAmount = Math.min(creditorAmount, debtorAmount);

    settlements.push({
      from: debtorId,
      to: creditorId,
      amount: Math.round(settlementAmount * 100) / 100,
    });

    const newCreditorBalance = creditorAmount - settlementAmount;
    const newDebtorBalance = debtorAmount - settlementAmount;

    if (newCreditorBalance < 0.01) {
      creditorBalances.delete(creditorId);
    } else {
      creditorBalances.set(creditorId, newCreditorBalance);
    }

    if (newDebtorBalance < 0.01) {
      debtorBalances.delete(debtorId);
    } else {
      debtorBalances.set(debtorId, newDebtorBalance);
    }
  }

  return settlements;
};


const DAY = 24 * 60 * 60 * 1000;

/** The headline numbers of a group: what it cost, over how many days, and roughly per person. */
export const groupSummary = (expenses: Expense[], memberCount: number) => {
  const spent = expenses.filter((e) => e.kind !== "payment");
  const dates = spent.map((e) => e.createdAt).filter((t): t is number => !!t);
  const total = totalSpent(expenses);
  return {
    total,
    count: spent.length,
    days: dates.length ? Math.round((Math.max(...dates) - Math.min(...dates)) / DAY) + 1 : 0,
    perPerson: memberCount ? total / memberCount : 0,
  };
};

/** Money actually spent by the group — recorded payments are transfers, not spending. */
export const totalSpent = (expenses: Expense[]): number =>
  expenses.reduce((sum, e) => (e.kind === "payment" ? sum : sum + e.amount), 0);
