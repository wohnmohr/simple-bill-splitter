/**
 * UPI merchant discount rate (MDR) on person-to-merchant payments, per the
 * NPCI framework effective 15 October 2026 as publicly reported. It is a
 * merchant-side fee: customers and person-to-person transfers pay nothing.
 * Excludes GST and any payment-provider charges. Update here if NPCI revises it.
 */

export const MDR_EFFECTIVE_DATE = "15 October 2026";
/** Payments up to and including this amount carry no MDR. */
export const MDR_FREE_LIMIT = 2000;
/** Merchants receiving up to this much per month over UPI pay no MDR. */
export const SMALL_MERCHANT_MONTHLY_LIMIT = 100_000;

export type MerchantType = "standard" | "essential" | "capital_markets";

type MdrRule = {
	label: string;
	/** Percentage of the payment, if the fee is proportional. */
	rate?: number;
	/** Flat fee per payment, if the fee is fixed. */
	flat?: number;
	/** Maximum fee per payment. */
	cap?: number;
};

export const MDR_RULES: Record<MerchantType, MdrRule> = {
	standard: { label: "Most merchants (shops, restaurants, online)", rate: 0.4, cap: 300 },
	essential: {
		label: "Railways, telecom, insurance, fuel, utilities, agri inputs",
		flat: 5,
	},
	capital_markets: { label: "Mutual funds, securities & stockbrokers", rate: 0.02, cap: 300 },
};

export type MdrResult = {
	fee: number;
	reason: "within_free_limit" | "small_merchant" | "charged";
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function upiMdr(
	amount: number,
	type: MerchantType,
	smallMerchant: boolean
): MdrResult {
	if (!(amount > MDR_FREE_LIMIT)) return { fee: 0, reason: "within_free_limit" };
	if (smallMerchant) return { fee: 0, reason: "small_merchant" };

	const rule = MDR_RULES[type];
	if (rule.flat !== undefined) return { fee: rule.flat, reason: "charged" };

	const fee = (amount * (rule.rate ?? 0)) / 100;
	return { fee: round2(rule.cap ? Math.min(fee, rule.cap) : fee), reason: "charged" };
}

/* ---------- Splitting a large amount into payments ---------- */

/** Most a single payment can be before MDR applies. */
export const MAX_FREE_PAYMENT = MDR_FREE_LIMIT;

export type PaymentGroup = { count: number; amount: number };

export type SplitPlan = {
	payments: number;
	/** Compact description, e.g. [{count: 499, amount: 2000}, {count: 1, amount: 1500}]. */
	groups: PaymentGroup[];
	fee: number;
};

/** Fewest payments that keep every payment within the MDR-free limit. */
export const minFreePayments = (total: number) =>
	total > 0 ? Math.ceil(total / MAX_FREE_PAYMENT) : 0;

/**
 * Cheapest way to take `total` in `payments` payments: fill payments with the
 * free maximum and put whatever is left in one payment. Once `payments` is
 * enough for every payment to be within the free limit, spread the total evenly
 * instead so no payment is a lopsided remainder.
 *
 * Groups, not rows: ₹10 lakh is 500 payments but only two groups.
 */
export function planPayments(
	total: number,
	payments: number,
	type: MerchantType,
	smallMerchant: boolean
): SplitPlan {
	const whole = Math.round(total);
	const k = Math.max(1, Math.min(Math.floor(payments), Math.max(whole, 1)));
	const groups: PaymentGroup[] = [];

	if (k >= minFreePayments(whole)) {
		const base = Math.floor(whole / k);
		const extra = whole - base * k; // `extra` payments carry one more rupee
		if (extra) groups.push({ count: extra, amount: base + 1 });
		if (k - extra) groups.push({ count: k - extra, amount: base });
	} else {
		groups.push({ count: k - 1, amount: MAX_FREE_PAYMENT });
		groups.push({ count: 1, amount: whole - MAX_FREE_PAYMENT * (k - 1) });
	}

	const clean = groups.filter((g) => g.count > 0);
	const fee = round2(
		clean.reduce((sum, g) => sum + g.count * upiMdr(g.amount, type, smallMerchant).fee, 0)
	);
	return { payments: k, groups: clean, fee };
}
