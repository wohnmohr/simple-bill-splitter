"use client";

import { useState } from "react";
import { FeedbackForm } from "@/components/Feedback/FeedbackForm";
import { collectFeedbackContext } from "@/lib/feedbackContext";
import { pageArea, track } from "@/lib/analytics";

/**
 * "Tell us what happened", shown under an error. It opens in place (so it
 * works inside dialogs too), and one tap on a reason sends it, with which step
 * failed (`problem`, a fixed word) and the recent steps attached.
 */
export const ReportProblem = ({ problem, className = "" }: { problem: string; className?: string }) => {
	const [open, setOpen] = useState(false);
	if (!open) {
		return (
			<button
				type="button"
				onClick={() => {
					track("feedback_opened", { source: "problem", problem, area: pageArea() });
					setOpen(true);
				}}
				className={`text-sm font-medium text-brand-700 hover:underline ${className}`}
			>
				Tell us what happened
			</button>
		);
	}
	return (
		<div className={`rounded-xl border border-line-strong bg-paper p-3 text-left ${className}`} data-feedback-inline>
			<FeedbackForm
				trigger="problem"
				getContext={() => ({ ...collectFeedbackContext({ trigger: "problem" }), problem })}
				onDone={() => setOpen(false)}
			/>
		</div>
	);
};
