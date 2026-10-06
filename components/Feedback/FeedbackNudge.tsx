"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { FeedbackForm } from "@/components/Feedback/FeedbackForm";
import { collectFeedbackContext } from "@/lib/feedbackContext";
import { track } from "@/lib/analytics";
import {
	FEEDBACK_MOMENT_EVENT,
	canShowFeedbackNudge,
	isUserBusy,
	markFeedbackNudgeShown,
	recordFeedbackOutcome,
	type NudgeOutcome,
} from "@/lib/feedbackNudge";

const SETTLE_DELAY_MS = 3000; // let the success state land before asking anything
const RETRY_MS = 3000;
const MAX_RETRIES = 5;
const AUTO_HIDE_MS = 12000;

/**
 * A small, non-blocking card that asks "how did that go?" right after someone
 * finishes something (shares a settlement, marks a payment). It never takes
 * focus, waits while they're typing or in a dialog, fades away on its own if
 * ignored, and stays quiet for weeks after any reply or dismissal.
 */
export const FeedbackNudge = () => {
	const [open, setOpen] = useState(false);
	const engaged = useRef(false);
	const timer = useRef<ReturnType<typeof setTimeout>>();

	useEffect(() => {
		let tries = 0;

		const attempt = () => {
			if (!canShowFeedbackNudge()) return;
			if (isUserBusy()) {
				if (tries++ < MAX_RETRIES) timer.current = setTimeout(attempt, RETRY_MS);
				return;
			}
			markFeedbackNudgeShown();
			engaged.current = false;
			setOpen(true);
			track("feedback_nudge_shown");
		};

		const onMoment = () => {
			clearTimeout(timer.current);
			tries = 0;
			timer.current = setTimeout(attempt, SETTLE_DELAY_MS);
		};

		window.addEventListener(FEEDBACK_MOMENT_EVENT, onMoment);
		return () => {
			window.removeEventListener(FEEDBACK_MOMENT_EVENT, onMoment);
			clearTimeout(timer.current);
		};
	}, []);

	const close = (outcome: NudgeOutcome) => {
		recordFeedbackOutcome(outcome);
		if (outcome !== "answered") track("feedback_nudge_dismissed", { outcome });
		setOpen(false);
	};

	// Fade away if nobody touches it — an ignored ask shouldn't linger.
	useEffect(() => {
		if (!open) return;
		const t = setTimeout(() => {
			if (!engaged.current) close("ignored");
		}, AUTO_HIDE_MS);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	if (!open) return null;

	return (
		<section
			aria-label="Feedback"
			data-feedback-inline
			onPointerDownCapture={() => (engaged.current = true)}
			onFocusCapture={() => (engaged.current = true)}
			className="surface shadow-raised fixed inset-x-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+8.5rem)] z-[300] max-h-[70vh] overflow-y-auto p-4 animate-[fade-in-up_0.25s_ease-out] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-80"
		>
			<button
				type="button"
				onClick={() => close("dismissed")}
				className="icon-btn absolute right-1.5 top-1.5"
				aria-label="No thanks"
			>
				<X className="h-4 w-4" />
			</button>
			<div className="pr-7">
				<FeedbackForm
					trigger="moment"
					question="How did that go?"
					getContext={() => collectFeedbackContext({ trigger: "moment" })}
					onSent={() => recordFeedbackOutcome("answered")}
					onDone={() => setOpen(false)}
				/>
			</div>
		</section>
	);
};
