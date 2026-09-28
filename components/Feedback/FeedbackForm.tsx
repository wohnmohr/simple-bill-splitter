"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { FeedbackContext, describeContext } from "@/lib/feedbackContext";

interface FeedbackFormProps {
	trigger: "group_settled" | "manual" | "share_viewed";
	/** Collected lazily at submit time so it reflects the latest state. */
	getContext: () => FeedbackContext;
	question?: string;
	/** Fires once the feedback is saved (before the thank-you is dismissed). */
	onSent?: () => void;
	onDone?: () => void;
}

const SCALE = [1, 2, 3, 4, 5] as const;

export const FeedbackForm = ({
	trigger,
	getContext,
	question = "How is SplitBiller working for you?",
	onSent,
	onDone,
}: FeedbackFormProps) => {
	const [rating, setRating] = useState<number | null>(null);
	const [comment, setComment] = useState("");
	const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
	const [error, setError] = useState<string | null>(null);
	const [showContext, setShowContext] = useState(false);
	const [honeypot, setHoneypot] = useState("");

	const contextLines = useMemo(
		() => (showContext ? describeContext(getContext()) : []),
		// Recompute each time the disclosure opens.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[showContext]
	);

	const submit = async () => {
		if (!rating || status === "sending") return;
		setStatus("sending");
		setError(null);
		try {
			const res = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					rating,
					comment,
					trigger,
					context: getContext(),
					website: honeypot,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || "Couldn't send feedback. Try again.");
			track("feedback_submitted", { rating, trigger, has_comment: comment.trim().length > 0 });
			setStatus("sent");
			onSent?.();
		} catch (err) {
			setStatus("idle");
			setError((err as Error).message);
		}
	};

	if (status === "sent") {
		return (
			<div className="text-center" role="status">
				<span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-positive-soft">
					<Check className="h-5 w-5 text-positive" strokeWidth={2.5} />
				</span>
				<p className="mt-3 font-semibold text-ink">Thank you — we read every one.</p>
				<p className="mt-1 text-sm text-ink-muted">
					Missing something bigger?{" "}
					<Link href="/feature-requests" className="font-medium text-brand-700 hover:underline">
						Request a feature
					</Link>
				</p>
				{onDone && (
					<button type="button" onClick={onDone} className="btn-secondary mt-4">
						Done
					</button>
				)}
			</div>
		);
	}

	const followUp =
		rating === null
			? null
			: rating <= 3
			? "What got in the way?"
			: "What worked well — or what would make it even better?";

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<fieldset>
				<legend className="font-semibold text-ink">{question}</legend>
				<div className="mt-3 grid grid-cols-5 gap-1.5">
					{SCALE.map((n) => (
						<button
							key={n}
							type="button"
							aria-pressed={rating === n}
							aria-label={`${n} out of 5`}
							onClick={() => setRating(n)}
							className={`h-11 rounded-xl text-base font-semibold tabular-nums transition-colors ${
								rating === n
									? "bg-ink text-white"
									: rating !== null && n < rating
									? "border border-ink/20 bg-ink/[0.06] text-ink"
									: "border border-line-strong bg-white text-ink-soft hover:border-ink-muted"
							}`}
						>
							{n}
						</button>
					))}
				</div>
				<div className="mt-1.5 flex justify-between text-xs text-ink-muted" aria-hidden>
					<span>Frustrating</span>
					<span>Loved it</span>
				</div>
			</fieldset>

			{followUp && (
				<div className="mt-4 animate-[fade-in-up_0.2s_ease-out]">
					<label htmlFor={`fb-comment-${trigger}`} className="text-[13px] font-semibold text-ink-soft">
						{followUp} <span className="font-normal text-ink-muted">(optional)</span>
					</label>
					<textarea
						id={`fb-comment-${trigger}`}
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						rows={3}
						maxLength={2000}
						placeholder="Anything — a bug, a confusing step, an idea"
						className="mt-1.5 w-full resize-y rounded-xl border border-line-strong bg-white px-3 py-2.5 text-base text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
					/>
					{/* Honeypot for bots: hidden from people and assistive tech. */}
					<input
						type="text"
						name="website"
						value={honeypot}
						onChange={(e) => setHoneypot(e.target.value)}
						tabIndex={-1}
						autoComplete="off"
						aria-hidden
						className="absolute -left-[9999px] h-0 w-0 opacity-0"
					/>

					<button
						type="button"
						onClick={() => setShowContext((v) => !v)}
						aria-expanded={showContext}
						className="mt-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
					>
						<ChevronDown
							className={`h-4 w-4 transition-transform ${showContext ? "rotate-180" : ""}`}
						/>
						What we attach automatically
					</button>
					{showContext && (
						<ul className="mt-2 space-y-1 rounded-xl bg-paper p-3 text-sm text-ink-muted">
							{contextLines.map((line) => (
								<li key={line}>{line}</li>
							))}
						</ul>
					)}

					{error && (
						<p className="mt-3 text-sm text-negative" role="alert">
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={status === "sending"}
						className="btn-primary mt-4 w-full !py-3"
					>
						{status === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
						{status === "sending" ? "Sending…" : "Send feedback"}
					</button>
				</div>
			)}
		</form>
	);
};
