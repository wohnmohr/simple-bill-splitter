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
