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
