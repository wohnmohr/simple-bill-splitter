import type { Currency } from "@/types";
import { roundMoney } from "@/utils/calculations";

/**
 * "₹1,25,000", "₹33.33", "$1,250.00", "¥1,000". Rupees use Indian digit
 * grouping and drop ".00" on whole amounts; yen have no decimals.
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
  const digits = currency.code === "JPY" || (currency.code === "INR" && Number.isInteger(roundMoney(amount))) ? 0 : 2;
  return `${currency.symbol}${amount.toLocaleString(currency.code === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
};

/** "Priya", "Priya and Asha", "Priya + 2". */
export const joinNames = (names: string[]) =>
  names.length <= 2 ? names.join(" and ") : `${names[0]} + ${names.length - 1}`;

/** yyyy-mm-dd in local time, for <input type="date">. */
export const toDateInput = (ms: number) => {
	const d = new Date(ms);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Local noon of the chosen day, so time zones never shift the date. */
export const fromDateInput = (value: string) => {
	const [y, m, d] = value.split("-").map(Number);
	return new Date(y, m - 1, d, 12).getTime();
};
