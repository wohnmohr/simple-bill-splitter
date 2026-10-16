import { noteFeedbackMoment } from "@/lib/feedbackNudge";
import { capture, withPostHog } from "@/lib/posthogClient";

/** High-level product events only — never send names, amounts, or expense details. */
export type AnalyticsEvent =
	| "landing_cta_clicked"
	| "landing_video_unmuted"
	| "tool_calculator_engaged"
	| "calculator_result_viewed"
	| "calculator_continue_clicked"
	| "calculator_saved_as_group"
	| "calculator_save_failed"
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
	| "expense_suggestion_used"
	| "quick_add_previewed"
	| "quick_add_saved"
	| "dashboard_settlements_tab_viewed"
	| "upi_pay_link_clicked"
	| "settlement_marked_paid"
	| "settlement_remind_clicked"
	| "feedback_nudge_shown"
	| "feedback_nudge_dismissed"
	| "feedback_opened"
	| "feedback_submitted"
	| "feature_request_submitted"
	| "contact_message_sent"
	| "order_scan_started"
	| "order_scan_read"
	| "order_scan_failed"
	| "order_split_used"
	| "split_link_created"
	| "split_link_shared"
	| "split_link_opened"
	| "split_open_failed"
	| "split_payment_marked"
	| "bill_link_created"
	| "bill_link_opened"
	| "bill_items_claimed"
	| "bill_payment_marked"
	| "bill_saved_as_group"
	| "split_saved_as_group"
	| "group_sync_enabled"
	| "group_sync_link_shared"
	| "group_joined"
	| "group_join_failed"
	| "group_link_reset"
	| "group_deleted_for_everyone"
	| "group_theme_changed"
	| "group_identity_chosen"
	| "group_personal_link_copied"
	| "invite_nudge_shown"
	| "invite_nudge_clicked"
	| "invite_nudge_dismissed"
	| "install_prompt_shown"
	| "install_prompt_clicked"
	| "install_prompt_dismissed"
	| "app_installed";

type EventProps = Record<string, string | number | boolean | undefined | null>;

// Last few product actions, kept in memory only, so feedback can say what
// someone was doing. Event names only — never amounts, names or UPI IDs.
const recentActions: string[] = [];

export function getRecentActions(): string[] {
	return [...recentActions];
}

/** Which part of the product a page belongs to. Never the full path (it can hold ids). */
export function pageArea(): string {
	if (typeof window === "undefined") return "unknown";
	const seg = window.location.pathname.split("/")[1] || "home";
	if (seg === "s" || seg === "pay-story") return "split_view";
	if (seg === "g") return "group_join";
	if (seg === "split") return "split_create";
	return seg === "dashboard" || seg === "share" || seg === "home" ? seg : "tool";
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
