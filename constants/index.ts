import type { Currency } from "@/types";

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

/** Fallback before the browser is known (server render, old data). New groups use utils/localCurrency. */
export const DEFAULT_CURRENCY = CURRENCIES[0];

/** Generous: groups live in this browser's storage, and synced groups people join count too. */
export const MAX_GROUPS = 50;
export const STORAGE_KEY = "bill-splitter-groups";
