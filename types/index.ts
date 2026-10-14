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
  /**
   * Present when the group is end-to-end encrypted and synced. Holds the link
   * secret (and the stretched passphrase, if the group has one); both stay on
   * this device and in the link's #fragment, never on the server.
   */
  sync?: GroupSyncLink;
  /** Theme id from utils/themes. Shared with everyone in a synced group. */
  theme?: string;
  /**
   * Nicknames this device gives members, by person id. They never leave the
   * device: not synced, not in share links. See utils/identity shownMembers.
   */
  nicknames?: Record<string, string>;
};

export type GroupSyncLink = {
  secret: string;
  /** Argon2id output of the group passphrase; the passphrase itself is never stored. */
  pass?: string;
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

