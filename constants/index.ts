import { Currency } from "@/types";

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

/** Default for new groups and calculators — India-first. */
export const DEFAULT_CURRENCY = CURRENCIES[0];

export const MAX_GROUPS = 3;
export const STORAGE_KEY = "bill-splitter-groups";
