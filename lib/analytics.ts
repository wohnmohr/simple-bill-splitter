import posthog from "posthog-js";

/** High-level product events only — never send names, amounts, or expense details. */
export type AnalyticsEvent =
	| "landing_cta_clicked"
	| "tool_calculator_engaged"
	| "calculator_result_viewed"
	| "calculator_continue_clicked"
	| "share_settlement_clicked"
	| "share_settlement_succeeded"
	| "share_settlement_failed"
	| "share_link_opened"
	| "share_link_decode_failed"
	| "share_imported_to_app"
	| "share_import_failed"
	| "dashboard_group_created"
	| "dashboard_member_added"
	| "dashboard_expense_added"
	| "dashboard_settlements_tab_viewed"
	| "upi_pay_link_clicked";

type EventProps = Record<string, string | number | boolean | undefined | null>;

export function track(event: AnalyticsEvent, properties?: EventProps): void {
	if (typeof window === "undefined") return;
	if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
	try {
		posthog.capture(event, properties);
	} catch {
		// Never let analytics break the product
	}
}

export function trackError(
	error: unknown,
	context?: EventProps & { source?: string }
): void {
	if (typeof window === "undefined") return;
	if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

	const err =
		error instanceof Error
			? error
			: new Error(typeof error === "string" ? error : "Unknown error");

	try {
		posthog.captureException(err, {
			...context,
			source: context?.source || "app",
		});
	} catch {
		try {
			posthog.capture("client_error", {
				message: err.message,
				name: err.name,
				...context,
			});
		} catch {
			// ignore
		}
	}
}
