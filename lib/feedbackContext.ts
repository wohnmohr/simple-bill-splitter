import { Group } from "@/types";
import { getRecentActions } from "@/lib/analytics";

export type FeedbackContext = Record<string, string | number | boolean | string[]>;

/**
 * Context attached to feedback so users don't have to explain their setup.
 * Deliberately shape-only: counts and flags about a group, never its name,
 * members, amounts, descriptions or UPI IDs.
 */
export function collectFeedbackContext(options: {
	trigger: string;
	group?: Group | null;
	tab?: string;
}): FeedbackContext {
	const ctx: FeedbackContext = { trigger: options.trigger };
	if (typeof window === "undefined") return ctx;

	const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
	ctx.path = window.location.pathname;
	ctx.device = coarse ? (window.innerWidth >= 768 ? "tablet" : "phone") : "desktop";
	ctx.viewport = `${window.innerWidth}x${window.innerHeight}`;
	ctx.locale = navigator.language;
	ctx.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	ctx.installed_app = window.matchMedia("(display-mode: standalone)").matches;
	ctx.online = navigator.onLine;
	ctx.session_seconds = Math.round(performance.now() / 1000);
	if (options.tab) ctx.tab = options.tab;

	try {
		const stored = JSON.parse(localStorage.getItem("bill-splitter-groups") || "[]");
		ctx.groups_saved = Array.isArray(stored) ? stored.length : 0;
	} catch {
		/* storage unavailable */
	}

	const g = options.group;
	if (g) {
		const bills = g.expenses.filter((e) => e.kind !== "payment");
		const payments = g.expenses.length - bills.length;
		const dated = g.expenses.map((e) => e.createdAt).filter((t): t is number => !!t);
		ctx.currency = g.currency.code;
		ctx.members = g.members.length;
		ctx.members_with_upi = g.members.filter((m) => m.upiId?.trim()).length;
		ctx.expenses = bills.length;
		ctx.percentage_splits = bills.filter((e) => e.splitMethod === "percentage").length;
		ctx.payments_recorded = payments;
		ctx.identity_chosen = g.meId !== undefined;
		if (dated.length) {
			ctx.group_age_days = Math.round((Date.now() - Math.min(...dated)) / 86_400_000);
		}
	}

	ctx.recent_actions = getRecentActions();
	return ctx;
}

/** Plain-language list of what gets sent, shown to the user before submitting. */
export function describeContext(ctx: FeedbackContext): string[] {
	const lines = [
		`Device: ${ctx.device ?? "unknown"}, screen ${ctx.viewport ?? "?"}, ${ctx.locale ?? ""}`.trim(),
	];
	if (ctx.members !== undefined) {
		const n = (count: unknown, word: string) =>
			`${count} ${word}${count === 1 ? "" : "s"}`;
		lines.push(
			`Group shape: ${n(ctx.members, "member")}, ${n(ctx.expenses, "expense")}, ${n(
				ctx.payments_recorded,
				"payment"
			)} recorded (${ctx.currency})`
		);
	}
	const actions = ctx.recent_actions as string[] | undefined;
	if (actions?.length) {
		lines.push(`Recent steps: ${actions.slice(-5).map((a) => a.replace(/_/g, " ")).join(" → ")}`);
	}
	lines.push("Never sent: names, amounts, descriptions or UPI IDs.");
	return lines;
}
