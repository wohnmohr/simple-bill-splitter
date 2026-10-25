"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Frown, Loader2, Meh, Smile } from "lucide-react";
import { track, pageArea } from "@/lib/analytics";
import { FeedbackContext, describeContext } from "@/lib/feedbackContext";

export type FeedbackTrigger = "group_settled" | "manual" | "share_viewed" | "moment" | "problem";

interface FeedbackFormProps {
	trigger: FeedbackTrigger;
	/** Collected lazily at submit time so it reflects the latest state. */
	getContext: () => FeedbackContext;
	question?: string;
	/** Fires once the feedback is saved (before the thank-you is dismissed). */
	onSent?: () => void;
	onDone?: () => void;
}

/** Stored as a 1–5 rating, so older feedback and the new faces read on one scale. */
const MOODS = [
	{ rating: 1, label: "Not great", Icon: Frown },
	{ rating: 3, label: "Okay", Icon: Meh },
	{ rating: 5, label: "Loved it", Icon: Smile },
] as const;

/** Reasons are fixed words, so they can be counted without anyone typing. */
const REASONS = [
	["confusing", "Confusing"],
	["too_many_steps", "Too many steps"],
	["broke", "Something broke"],
	["missing_feature", "Missing a feature"],
	["friends_didnt_join", "Friends didn't join"],
] as const;

/** After an error the question is what it broke for them. */
const PROBLEM_REASONS = [
	["didnt_load", "It didn't load"],
	["wrong_numbers", "Numbers look wrong"],
	["data_missing", "Something went missing"],
	["confusing", "I didn't understand it"],
] as const;

type Reason = (typeof REASONS)[number][0] | (typeof PROBLEM_REASONS)[number][0];

/**
 * One tap to answer: pick a face. Loved it sends straight away; anything less
 * asks what got in the way, where one more tap on a reason sends it. Typing is
 * always optional. A problem report skips the faces: it starts at the reasons.
 */
export const FeedbackForm = ({ trigger, getContext, question, onSent, onDone }: FeedbackFormProps) => {
	const problem = trigger === "problem";
	// Someone who opened Feedback themselves came to say something: always offer the note.
	const askWhy = (rating: number) => rating < 5 || trigger === "manual";
	const [rating, setRating] = useState<number | null>(problem ? 1 : null);
	const [writing, setWriting] = useState(trigger === "manual");
	const [comment, setComment] = useState("");
	// While writing, a reason is picked and sent with the note; otherwise tapping one sends it.
	const [reason, setReason] = useState<Reason>();
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

	const send = async (score: number, picked?: Reason) => {
		if (status === "sending") return;
		setStatus("sending");
		setError(null);
		try {
			const res = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					rating: score,
					comment,
					trigger,
					context: { ...getContext(), ...(picked && { reason: picked }) },
					website: honeypot,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || "Couldn't send feedback. Try again.");
			// The text stays with us; analytics only learns that there was some.
			track("feedback_submitted", { rating: score, reason: picked, trigger, area: pageArea(), has_comment: comment.trim().length > 0 });
			setStatus("sent");
			onSent?.();
		} catch (err) {
			setStatus("idle");
			setError((err as Error).message);
		}
	};

	const pick = (score: number) => {
		setRating(score);
		if (!askWhy(score)) void send(score);
	};

	if (status === "sent") {
		return (
			<div className="text-center" role="status">
				<span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-positive-soft">
					<Check className="h-5 w-5 text-positive" strokeWidth={2.5} />
				</span>
				<p className="mt-3 font-semibold text-ink">Thank you, we read every one.</p>
				<p className="mt-1 text-sm text-ink-muted">
					Missing something bigger?{" "}
					<Link href="/roadmap#request" className="font-medium text-brand-700 hover:underline">
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

	const sending = status === "sending";
	const why = rating !== null && askWhy(rating);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (rating !== null) void send(rating, reason);
			}}
		>
			{!problem && (
				<fieldset disabled={sending}>
					<legend className="font-semibold text-ink">{question ?? "How is SplitBiller working for you?"}</legend>
					<div className="mt-3 grid grid-cols-3 gap-2">
						{MOODS.map(({ rating: score, label, Icon }) => (
							<button
								key={score}
								type="button"
								aria-pressed={rating === score}
								onClick={() => pick(score)}
								className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[13px] font-medium transition-colors active:scale-[0.97] ${
									rating === score
										? "border-ink bg-ink text-on-ink"
										: "border-line-strong bg-surface text-ink-soft hover:border-ink-muted hover:text-ink"
								}`}
							>
								{sending && rating === score ? (
									<Loader2 className="h-6 w-6 animate-spin" />
								) : (
									<Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
								)}
								{label}
							</button>
						))}
					</div>
				</fieldset>
			)}

			{why && (
				<div className={problem ? "" : "mt-4 animate-[fade-in-up_0.2s_ease-out]"}>
					<p className="font-semibold text-ink">
						{problem ? question ?? "Sorry about that. What went wrong?" : rating === 5 ? "What should we keep doing?" : "What got in the way?"}
					</p>
					{rating! < 5 && (
						<div className="mt-2 flex flex-wrap gap-1.5">
							{(problem ? PROBLEM_REASONS : REASONS).map(([key, label]) => (
								<button
									key={key}
									type="button"
									disabled={sending}
									aria-pressed={writing ? reason === key : undefined}
									onClick={() => (writing ? setReason(reason === key ? undefined : key) : void send(rating!, key))}
									className={`rounded-full border px-3 py-1.5 text-sm font-medium active:scale-[0.97] disabled:opacity-60 ${
										reason === key ? "border-ink bg-ink text-on-ink" : "border-line-strong bg-surface text-ink hover:border-ink-muted"
									}`}
								>
									{label}
								</button>
							))}
						</div>
					)}

					{writing ? (
						<>
							<label htmlFor={`fb-comment-${trigger}`} className="mt-3 block text-[13px] font-semibold text-ink-soft">
								Tell us more <span className="font-normal text-ink-muted">(optional)</span>
							</label>
							<textarea
								id={`fb-comment-${trigger}`}
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								rows={3}
								maxLength={2000}
								placeholder="A bug, a confusing step, an idea"
								className="mt-1.5 w-full resize-y rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-base text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
							/>
							<button type="submit" disabled={sending} className="btn-primary mt-3 w-full !py-3">
								{sending && <Loader2 className="h-4 w-4 animate-spin" />}
								{sending ? "Sending…" : "Send"}
							</button>
						</>
					) : (
						<button type="button" onClick={() => setWriting(true)} className="mt-3 text-sm font-medium text-brand-700 hover:underline">
							Something else? Write it
						</button>
					)}

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
						className="mt-3 flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
					>
						<ChevronDown className={`h-4 w-4 transition-transform ${showContext ? "rotate-180" : ""}`} />
						What we attach automatically
					</button>
					{showContext && (
						<ul className="mt-2 space-y-1 rounded-xl bg-paper p-3 text-sm text-ink-muted">
							{contextLines.map((line) => (
								<li key={line}>{line}</li>
							))}
						</ul>
					)}
				</div>
			)}

			{error && (
				<p className="mt-3 text-sm text-negative" role="alert">
					{error}
				</p>
			)}
		</form>
	);
};
