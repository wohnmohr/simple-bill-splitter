"use client";

import { useEffect, useRef } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Tally posts its events to the parent page as JSON strings. */
function tallyMessage(data: unknown): { event?: string; payload?: { height?: unknown } } | null {
	if (typeof data !== "string" || !data.includes("Tally.")) return null;
	try {
		return JSON.parse(data);
	} catch {
		return null;
	}
}

type Props = {
	formId: string;
	/** Accessible name of the frame. */
	title: string;
	/** Fills the form's hidden "source" field, so we know which page a submission came from. */
	source: string;
	/** Counted when the form is submitted. */
	event: AnalyticsEvent;
	/** Room to reserve until Tally sends the form's height. */
	height?: number;
};

/**
 * A Tally form embedded on a transparent background so it sits in our card;
 * its colours and font are set to SplitBiller's in Tally itself.
 */
export const TallyForm = ({ formId, title, source, event, height = 560 }: Props) => {
	const frame = useRef<HTMLIFrameElement>(null);

	// The form runs in Tally's own frame; no Tally script runs on our page, where it
	// could read the group keys. The frame tells us its height, and when it's sent.
	useEffect(() => {
		const onMessage = (e: MessageEvent) => {
			if (e.origin !== "https://tally.so" || e.source !== frame.current?.contentWindow) return;
			const msg = tallyMessage(e.data);
			if (msg?.event === "Tally.FormResized" && typeof msg.payload?.height === "number" && frame.current) {
				frame.current.style.height = `${msg.payload.height}px`;
			}
			if (msg?.event === "Tally.FormSubmitted") track(event, { source });
		};
		window.addEventListener("message", onMessage);
		// Load the form only now, so its first height message isn't missed.
		if (frame.current && !frame.current.src) frame.current.src = frame.current.dataset.tallySrc!;
		return () => window.removeEventListener("message", onMessage);
	}, [source, event]);

	const params = new URLSearchParams({
		alignLeft: "1",
		hideTitle: "1",
		transparentBackground: "1",
		dynamicHeight: "1",
		source,
	});

	return (
		<>
			<iframe
				ref={frame}
				data-tally-src={`https://tally.so/embed/${formId}?${params}`}
				loading="lazy"
				width="100%"
				height={height}
				title={title}
				className="block w-full border-0"
			/>
			<noscript>
				<a href={`https://tally.so/r/${formId}`} className="btn-primary">
					Open the form
				</a>
			</noscript>
		</>
	);
};
