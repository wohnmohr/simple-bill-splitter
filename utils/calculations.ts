import { Expense, Person, Balance, Settlement } from "@/types";

export const calculateBalances = (
  people: Person[],
  expenses: Expense[]
): Balance[] => {
  const balances: Map<string, number> = new Map();

  people.forEach((person) => {
    balances.set(person.id, 0);
  });

  expenses.forEach((expense) => {
    const perPersonShare = expense.amount / expense.participants.length;

    balances.set(
      expense.paidBy,
      (balances.get(expense.paidBy) || 0) + expense.amount
    );

    expense.participants.forEach((participantId) => {
      balances.set(
        participantId,
        (balances.get(participantId) || 0) - perPersonShare
      );
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

