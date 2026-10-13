"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { FeedbackCard } from "@/components/Feedback/FeedbackCard";
import { FeedbackForm } from "@/components/Feedback/FeedbackForm";
import { collectFeedbackContext } from "@/lib/feedbackContext";
import { pageArea, track } from "@/lib/analytics";

/** A quiet "Feedback" button for pages without the dashboard header, such as split links. */
export const FeedbackButton = () => {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	return (
		<>
			<button
				type="button"
				onClick={() => {
					if (!open) track("feedback_opened", { source: "header", area: pageArea() });
					setOpen(!open);
				}}
				aria-expanded={open}
				aria-label="Feedback"
				className="btn-ghost"
			>
				<MessageSquare className="h-4 w-4" />
				<span className="hidden sm:inline">Feedback</span>
			</button>
			{open && (
				<FeedbackCard onClose={() => setOpen(false)} closeLabel="Close feedback">
					<FeedbackForm
						trigger="manual"
						getContext={() => collectFeedbackContext({ trigger: "manual" })}
						onDone={() => setOpen(false)}
					/>
				</FeedbackCard>
			)}
		</>
	);
};
