import { Currency } from "@/types";

export const formatCurrency = (amount: number, currency: Currency): string => {
  if (currency.code === "JPY") {
    return `${currency.symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${currency.symbol}${amount.toFixed(2)}`;
};

