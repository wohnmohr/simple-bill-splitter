import { Expense, Person, Balance, Settlement } from "@/types";

/** The custom split an expense carries: percentages or exact amounts, per person. */
export const splitWeights = (expense: Expense): Record<string, number> | undefined =>
  expense.splitMethod === "percentage"
    ? expense.percentages
    : expense.splitMethod === "exact"
      ? expense.amounts
      : undefined;

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

    balances.set(
      expense.paidBy,
      (balances.get(expense.paidBy) || 0) + expense.amount
    );
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


/** Money actually spent by the group — recorded payments are transfers, not spending. */
export const totalSpent = (expenses: Expense[]): number =>
  expenses.reduce((sum, e) => (e.kind === "payment" ? sum : sum + e.amount), 0);
