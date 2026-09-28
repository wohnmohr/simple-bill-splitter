export type Person = {
  id: string;
  name: string;
  /** Optional UPI VPA (e.g. name@upi) for INR settlements */
  upiId?: string;
};

export type SplitMethod = "equally" | "percentage";

export type Expense = {
  id: string;
  amount: number;
  paidBy: string; // person id
  participants: string[]; // array of person ids
  description?: string; // optional description for the expense
  splitMethod: SplitMethod; // how the expense is split
  percentages?: Record<string, number>; // person id -> percentage (only for percentage split)
  /** "payment" = a recorded settlement: paidBy paid participants[0] back. */
  kind?: "payment";
  /** Epoch ms when the entry was created. Missing on older data. */
  createdAt?: number;
};

export type Group = {
  id: string;
  name: string;
  members: Person[];
  expenses: Expense[];
  currency: Currency;
  /**
   * Who is using this device, for this group. Stays on the device and is
   * never included in share links. undefined = not asked yet; null = just viewing.
   */
  meId?: string | null;
};

export type Balance = {
  personId: string;
  balance: number; // positive = owes money, negative = is owed money
};

export type Settlement = {
  from: string; // person id
  to: string; // person id
  amount: number;
};

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export type Tab = "transactions" | "balances" | "settlements";

