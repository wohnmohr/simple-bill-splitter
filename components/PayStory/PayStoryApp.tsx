"use client";

import { useCallback, useEffect, useState } from "react";
import { decodeRequest, encodeRequest, type PayRequest } from "@/utils/payStory";
import { TemplateGrid } from "./TemplateGrid";
import { SplitViewKeyed as SplitView } from "./views";

const fragment = () => (typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, ""));

/** A shared split lives in the #fragment. Without one, send people to pick a split. */
export const PayStoryApp = () => {
	const [req, setReq] = useState<PayRequest | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const sync = () => {
			setReq(fragment() ? decodeRequest(fragment()) : null);
			setReady(true);
		};
		sync();
		window.addEventListener("hashchange", sync);
		return () => window.removeEventListener("hashchange", sync);
	}, []);

	const update = useCallback((next: PayRequest) => {
		window.location.hash = encodeRequest(next);
	}, []);

	if (!ready) return null;
	if (req) return <SplitView req={req} onChange={update} />;
	return (
		<div className="mx-auto w-full max-w-5xl min-w-0 space-y-5 px-4 py-8">
			<div>
				<h1 className="font-display text-3xl font-semibold text-ink">What are you splitting?</h1>
				<p className="mt-1 text-ink-muted">Pick one to get a shareable link where friends pay you by UPI.</p>
			</div>
			<TemplateGrid />
		</div>
	);
};
