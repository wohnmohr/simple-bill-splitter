"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

const EMBED_SCRIPT = "https://tally.so/widgets/embed.js";

type TallyWindow = Window & { Tally?: { loadEmbeds: () => void } };

/** Tally's own loader sizes the frame to the form; without it, the frame still loads at a fixed height. */
function loadEmbeds() {
	const w = window as TallyWindow;
	if (w.Tally) return w.Tally.loadEmbeds();
	document.querySelectorAll<HTMLIFrameElement>("iframe[data-tally-src]:not([src])").forEach((f) => {
		f.src = f.dataset.tallySrc!;
	});
}

type Props = {
	formId: string;
	/** Accessible name of the frame. */
	title: string;
	/** Fills the form's hidden "source" field, so we know which page a submission came from. */
	source: string;
	/** Counted when the form is submitted. */
	event: AnalyticsEvent;
	/** Room to reserve before Tally sizes the frame to the form. */
	height?: number;
};

/**
 * A Tally form embedded on a transparent background so it sits in our card;
 * its colours and font are set to SplitBiller's in Tally itself.
 */
export const TallyForm = ({ formId, title, source, event, height = 560 }: Props) => {
	useEffect(() => {
		if ((window as TallyWindow).Tally) loadEmbeds();
		else if (!document.querySelector(`script[src="${EMBED_SCRIPT}"]`)) {
			const s = document.createElement("script");
			s.src = EMBED_SCRIPT;
			s.async = true;
			s.onload = s.onerror = loadEmbeds;
			document.body.appendChild(s);
		}

		const onMessage = (e: MessageEvent) => {
			if (e.origin !== "https://tally.so" || typeof e.data !== "string" || !e.data.includes("Tally.FormSubmitted")) return;
			if (!e.data.includes(formId)) return;
			track(event, { source });
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [formId, source, event]);

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
