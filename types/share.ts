import { Currency, Expense, Person } from "@/types";

/** Compact wire format for privacy-preserving shares (short keys = smaller URLs). */
export type CompactSharePayload = {
	v: 1;
	n: string; // group name
	c: string; // currency code
	m: { i: string; n: string; u?: string }[]; // members (+ optional UPI id)
	e: {
		a: number; // amount
		p: string; // paidBy
		t: string[]; // participants
		d?: string; // description
		s?: "e" | "p"; // equally | percentage
		r?: Record<string, number>; // percentages
	}[];
};

export type ShareSnapshot = {
	name: string;
	currency: Currency;
	members: Person[];
	expenses: Expense[];
};
