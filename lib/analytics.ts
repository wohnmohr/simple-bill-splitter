import { noteFeedbackMoment } from "@/lib/feedbackNudge";
import { capture, withPostHog } from "@/lib/posthogClient";

/** High-level product events only — never send names, amounts, or expense details. */
export type AnalyticsEvent =
	| "landing_cta_clicked"
	| "landing_video_unmuted"
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
	| "upi_pay_link_clicked"
	| "settlement_marked_paid"
	| "settlement_remind_clicked"
	| "feedback_nudge_shown"
	| "feedback_nudge_dismissed"
	| "feedback_opened"
	| "feedback_submitted"
	| "feature_request_submitted";

type EventProps = Record<string, string | number | boolean | undefined | null>;

// Last few product actions, kept in memory only, so feedback can say what
// someone was doing. Event names only — never amounts, names or UPI IDs.
const recentActions: string[] = [];

export function getRecentActions(): string[] {
	return [...recentActions];
}

export function track(event: AnalyticsEvent, properties?: EventProps): void {
	if (typeof window === "undefined") return;
	recentActions.push(event);
	if (recentActions.length > 15) recentActions.shift();
	noteFeedbackMoment(event);
	capture(event, properties);
}

export function trackError(
	error: unknown,
	context?: EventProps & { source?: string }
): void {
	if (typeof window === "undefined") return;

	const err =
		error instanceof Error
			? error
			: new Error(typeof error === "string" ? error : "Unknown error");

	withPostHog((ph) => {
		try {
			ph.captureException(err, { ...context, source: context?.source || "app" });
		} catch {
			ph.capture("client_error", { message: err.message, name: err.name, ...context });
		}
	});
}
