import { Currency } from "@/types";

export const formatCurrency = (amount: number, currency: Currency): string => {
  if (currency.code === "JPY") {
    return `${currency.symbol}${Math.round(amount).toLocaleString("en-IN")}`;
  }

  if (currency.code === "INR") {
    return `${currency.symbol}${amount.toLocaleString("en-IN", {
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${currency.symbol}${amount.toFixed(2)}`;
};
