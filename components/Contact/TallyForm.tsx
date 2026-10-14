"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { TALLY_FORM_ID, TALLY_FORM_URL } from "@/content/contact";

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

/**
 * The contact form, embedded from Tally on a transparent background so it
 * sits in our card, styled in SplitBiller's colours in Tally itself.
 */
export const TallyForm = ({ source }: { source: string }) => {
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
			track("contact_message_sent", { source });
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [source]);

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
				data-tally-src={`https://tally.so/embed/${TALLY_FORM_ID}?${params}`}
				loading="lazy"
				width="100%"
				height={560}
				title="Contact SplitBiller"
				className="block w-full border-0"
			/>
			<noscript>
				<a href={TALLY_FORM_URL} className="btn-primary">
					Open the contact form
				</a>
			</noscript>
		</>
	);
};
