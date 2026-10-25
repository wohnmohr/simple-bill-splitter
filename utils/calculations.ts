import type { Expense, Person, Balance, Settlement, SplitChoice, Group, Currency } from "@/types";

/**
 * Smallest units in one unit of a currency: 100 paise in a rupee, but yen have
 * no smaller coin. Money is shared out and settled in these whole units.
 */
export const minorUnits = (currency?: Pick<Currency, "code">) => (currency?.code === "JPY" ? 1 : 100);

/** Rounds to whole minor units (cents by default). */
export const roundMoney = (n: number, unit = 100) => Math.round(n * unit) / unit;

/**
 * Shares (2:1:1) as amounts that add up to exactly `amount`, in whole minor
 * units (`unit` per main unit); the rounding remainder goes to the last person.
 */
export const sharesToAmounts = (shares: Record<string, number>, amount: number, unit = 100): Record<string, number> => {
  const ids = Object.keys(shares).filter((id) => shares[id] > 0);
  const total = ids.reduce((sum, id) => sum + shares[id], 0);
  const amounts: Record<string, number> = {};
  let left = amount;
  ids.forEach((id, i) => {
    amounts[id] = roundMoney(i === ids.length - 1 ? left : (amount * shares[id]) / total, unit);
    left -= amounts[id];
  });
  return amounts;
};

/** A custom split is stored in the field its method reads: percentages or exact amounts (plus the shares they came from). */
export const splitFields = (choice: SplitChoice, weights: Record<string, number> | undefined, amount: number) =>
  choice === "shares"
    ? { splitMethod: "exact" as const, percentages: undefined, amounts: sharesToAmounts(weights ?? {}, amount), shares: weights }
    : {
        splitMethod: choice,
        percentages: choice === "percentage" ? weights : undefined,
        amounts: choice === "exact" ? weights : undefined,
        shares: undefined,
      };

/** How an expense's split was entered, for showing and editing it. */
export const splitChoice = (expense: Expense): SplitChoice =>
  expense.splitMethod === "exact" && expense.shares ? "shares" : expense.splitMethod;

/** The numbers that were typed for a split: shares, percentages or exact amounts. */
export const enteredWeights = (expense: Expense): Record<string, number> | undefined =>
  splitChoice(expense) === "shares" ? expense.shares : splitWeights(expense);

/** The custom split an expense carries: percentages or exact amounts, per person. */
export const splitWeights = (expense: Expense): Record<string, number> | undefined =>
  expense.splitMethod === "percentage"
    ? expense.percentages
    : expense.splitMethod === "exact"
      ? expense.amounts
      : undefined;

/** Who paid for an expense, and how much each, in whole minor units, adding up to exactly the amount. */
export const expensePayers = (expense: Expense, unit = 100): Map<string, number> =>
  new Map(Object.entries(sharesToAmounts(expense.payers ?? { [expense.paidBy]: 1 }, expense.amount, unit)));

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
 * no usable weights the expense is split equally. Shares are whole minor units,
 * so balances always add up to zero.
 */
export const expenseShares = (expense: Expense, unit = 100): Map<string, number> => {
  const weights = splitWeights(expense);
  const total = weights
    ? expense.participants.reduce((sum, id) => sum + (weights[id] || 0), 0)
    : 0;
  const amounts = sharesToAmounts(
    Object.fromEntries(expense.participants.map((id) => [id, total > 0 ? weights![id] || 0 : 1])),
    expense.amount,
    unit
  );
  return new Map(expense.participants.map((id) => [id, amounts[id] ?? 0]));
};

export const calculateBalances = (
  people: Person[],
  expenses: Expense[],
  unit = 100
): Balance[] => {
  const balances: Map<string, number> = new Map();

  people.forEach((person) => {
    balances.set(person.id, 0);
  });

  expenses.forEach((expense) => {
    expenseShares(expense, unit).forEach((share, participantId) => {
      balances.set(participantId, (balances.get(participantId) || 0) - share);
    });

    expensePayers(expense, unit).forEach((paid, payerId) => {
      balances.set(payerId, (balances.get(payerId) || 0) + paid);
    });
  });

  return Array.from(balances.entries()).map(([personId, balance]) => ({
    personId,
    balance: roundMoney(balance, unit),
  }));
};

export const calculateSettlements = (
  people: Person[],
  expenses: Expense[],
  unit = 100
): Settlement[] => {
  const balances = calculateBalances(people, expenses, unit);
  const settlements: Settlement[] = [];

  const creditors = balances
    .filter((b) => b.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  const debtors = balances
    .filter((b) => b.balance < 0)
    .sort((a, b) => a.balance - b.balance);

  // Settled in whole minor units so no float leftover is dropped or invented.
  const creditorBalances = new Map(
    creditors.map((c) => [c.personId, Math.round(c.balance * unit)])
  );
  const debtorBalances = new Map(
    debtors.map((d) => [d.personId, Math.round(-d.balance * unit)])
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
      amount: settlementAmount / unit,
    });

    const newCreditorBalance = creditorAmount - settlementAmount;
    const newDebtorBalance = debtorAmount - settlementAmount;

    if (newCreditorBalance === 0) {
      creditorBalances.delete(creditorId);
    } else {
      creditorBalances.set(creditorId, newCreditorBalance);
    }

    if (newDebtorBalance === 0) {
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

/** The viewer's net position in a group, or null when we don't know who they are. */
export const myBalance = (group: Group): number | null => {
  if (!group.meId) return null;
  const mine = calculateBalances(group.members, group.expenses, minorUnits(group.currency)).find((b) => b.personId === group.meId);
  return mine ? mine.balance : null;
};

export type MyTotal = { currency: Currency; owe: number; getBack: number };

/** What the viewer owes and gets back across their open groups, one entry per currency. */
export const myTotals = (groups: Group[]): MyTotal[] => {
  const byCode = new Map<string, MyTotal>();
  for (const group of groups) {
    const balance = group.closedAt ? null : myBalance(group);
    if (balance === null || Math.abs(balance) < 0.01) continue;
    const total = byCode.get(group.currency.code) ?? { currency: group.currency, owe: 0, getBack: 0 };
    const unit = minorUnits(group.currency);
    if (balance > 0) total.getBack = roundMoney(total.getBack + balance, unit);
    else total.owe = roundMoney(total.owe - balance, unit);
    byCode.set(group.currency.code, total);
  }
  return [...byCode.values()];
};
