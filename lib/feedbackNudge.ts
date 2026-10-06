/**
 * Rules for when to ask for feedback without getting in anyone's way.
 *
 * Ask only right after the person got what they came for (a "moment"), at
 * most once per session, and back off for weeks after any reply or dismissal.
 */

const STORAGE_KEY = "splitbiller-feedback-nudge";
export const FEEDBACK_MOMENT_EVENT = "sb:feedback-moment";

export type NudgeOutcome = "answered" | "dismissed" | "ignored";

const COOLDOWN_DAYS: Record<NudgeOutcome, number> = {
	answered: 90,
	dismissed: 30,
	ignored: 7,
};

/** Analytics events that mean the user just finished the job they came to do. */
const MOMENTS = new Set(["share_settlement_succeeded", "settlement_marked_paid"]);

let shownThisSession = false;

const readLast = (): { at: number; outcome: NudgeOutcome } | null => {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
	} catch {
		return null;
	}
};

export function recordFeedbackOutcome(outcome: NudgeOutcome): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), outcome }));
	} catch {
		/* storage unavailable: the once-per-session cap still applies */
	}
}

export function canShowFeedbackNudge(): boolean {
	if (shownThisSession) return false;
	const last = readLast();
	if (!last || !(last.outcome in COOLDOWN_DAYS)) return true;
	return Date.now() - last.at > COOLDOWN_DAYS[last.outcome] * 86_400_000;
}

export function markFeedbackNudgeShown(): void {
	shownThisSession = true;
}

/** True while the user is mid-task: typing, in a dialog, or already giving feedback. */
export function isUserBusy(): boolean {
	if (document.hidden) return true;
	if (document.querySelector('[role="dialog"], [data-feedback-inline]')) return true;
	const el = document.activeElement;
	return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

export function noteFeedbackMoment(event: string): void {
	if (typeof window !== "undefined" && MOMENTS.has(event)) {
		window.dispatchEvent(new Event(FEEDBACK_MOMENT_EVENT));
	}
}
