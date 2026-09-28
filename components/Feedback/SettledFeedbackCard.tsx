"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { FeedbackForm } from "@/components/Feedback/FeedbackForm";
import { FeedbackContext } from "@/lib/feedbackContext";

const storageKey = (groupId: string) => `splitbiller-feedback-${groupId}`;

/**
 * Asks for a review at the moment a group is fully settled — the natural end
 * of the job. Shown once per group; dismissing or answering hides it for good.
 */
export const SettledFeedbackCard = ({
	groupId,
	getContext,
}: {
	groupId: string;
	getContext: () => FeedbackContext;
}) => {
	const [hidden, setHidden] = useState(true);

	useEffect(() => {
		try {
			setHidden(localStorage.getItem(storageKey(groupId)) !== null);
		} catch {
			setHidden(false);
		}
	}, [groupId]);

	const remember = (reason: "dismissed" | "answered") => {
		try {
			localStorage.setItem(storageKey(groupId), reason);
		} catch {
			/* storage unavailable: it will just ask again next time */
		}
	};

	const hide = (reason: "dismissed" | "answered") => {
		remember(reason);
		setHidden(true);
	};

	if (hidden) return null;

	return (
		<section className="surface relative p-4 sm:p-5" aria-label="Feedback">
			<button
				type="button"
				onClick={() => hide("dismissed")}
				className="icon-btn absolute right-2 top-2"
				aria-label="No thanks"
			>
				<X className="h-4 w-4" />
			</button>
			<div className="pr-8">
				<FeedbackForm
					trigger="group_settled"
					question="How did settling up go?"
					getContext={getContext}
					onSent={() => remember("answered")}
					onDone={() => hide("answered")}
				/>
			</div>
		</section>
	);
};
