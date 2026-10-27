"use client";

import { useState } from "react";
import { ClipboardPaste, Link2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { pastedLinkPath } from "@/utils/pastedLink";

/**
 * Brings groups in from another browser or phone: paste a recovery link or a group link
 * copied there. Needed in the Play app, which has no address bar to paste a link into.
 */
export const PasteLink = ({ label = "Paste a link from another browser" }: { label?: string }) => {
	const [open, setOpen] = useState(false);
	const [text, setText] = useState("");
	const [error, setError] = useState(false);

	const go = (value: string) => {
		const path = pastedLinkPath(value, window.location.origin);
		setError(!path);
		if (!path) return;
		// Never the link itself: its #key opens the groups.
		track("link_pasted", { kind: path.startsWith("/r") ? "recovery" : "group" });
		window.location.assign(path);
	};

	const paste = async () => {
		try {
			const clip = await navigator.clipboard.readText();
			setText(clip);
			go(clip);
		} catch {
			/* clipboard blocked: the field still takes a long-press paste */
		}
	};

	if (!open) {
		return (
			<button type="button" onClick={() => setOpen(true)} className="inline-flex items-start gap-1.5 text-left font-medium text-brand-700 hover:underline">
				<Link2 className="mt-0.5 h-4 w-4 shrink-0" />
				{label}
			</button>
		);
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				go(text);
			}}
			className="ph-no-capture"
			data-ph-no-capture
		>
			<label className="label-text" htmlFor="pasted-link">Recovery link or group link</label>
			<p className="mt-0.5 text-sm text-ink-muted">
				In the browser that has your groups, copy the link from Back up my groups, or a group&apos;s share link.
			</p>
			<div className="mt-2 flex gap-2">
				<input
					id="pasted-link"
					// Text, not url: a whole pasted WhatsApp message should open too.
					type="text"
					inputMode="url"
					autoComplete="off"
					autoFocus
					placeholder="https://www.splitbiller.com/r#…"
					value={text}
					onChange={(e) => {
						setText(e.target.value);
						setError(false);
					}}
					aria-invalid={error || undefined}
					aria-describedby={error ? "pasted-link-error" : undefined}
					className="min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
				/>
				<button type="button" onClick={paste} className="btn-secondary shrink-0">
					<ClipboardPaste className="h-4 w-4" />
					Paste
				</button>
			</div>
			{error && (
				<p id="pasted-link-error" role="alert" className="mt-2 text-sm text-negative">
					That isn&apos;t a SplitBiller recovery or group link. Copy the whole link and try again.
				</p>
			)}
			<button type="submit" disabled={!text.trim()} className="btn-primary mt-3 w-full !py-3">
				Open link
			</button>
		</form>
	);
};
