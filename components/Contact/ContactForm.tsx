"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { CONTACT_TOPICS, type ContactTopic } from "@/content/contact";

const FIELD =
	"mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-base text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 aria-[invalid=true]:border-negative";

export const ContactForm = () => {
	const [topic, setTopic] = useState<ContactTopic>("question");
	const [message, setMessage] = useState("");
	const [email, setEmail] = useState("");
	const [honeypot, setHoneypot] = useState("");
	const [touched, setTouched] = useState(false);
	const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
	const [error, setError] = useState<string | null>(null);

	const messageOk = message.trim().length >= 10;
	const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

	const submit = async () => {
		setTouched(true);
		if (!messageOk || !emailOk || status === "sending") return;
		setStatus("sending");
		setError(null);
		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ topic, message, email, website: honeypot }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || "Couldn't send your message. Try again.");
			track("contact_message_sent", { topic });
			setStatus("sent");
		} catch (err) {
			setStatus("idle");
			setError((err as Error).message);
		}
	};

	if (status === "sent") {
		return (
			<div className="surface p-6 text-center sm:p-8" role="status">
				<span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-positive-soft">
					<Check className="h-6 w-6 text-positive" strokeWidth={2.5} />
				</span>
				<h2 className="mt-4 font-display text-2xl font-semibold text-ink">Message sent</h2>
				<p className="mx-auto mt-2 max-w-sm text-ink-soft">
					We&apos;ll reply to <span className="font-medium text-ink">{email.trim()}</span>.
				</p>
				<button
					type="button"
					onClick={() => {
						setMessage("");
						setTouched(false);
						setStatus("idle");
					}}
					className="btn-secondary mt-6"
				>
					Send another message
				</button>
			</div>
		);
	}

	return (
		<form
			className="surface space-y-5 p-5 sm:p-7"
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<fieldset>
				<legend className="text-[13px] font-semibold text-ink-soft">What&apos;s it about?</legend>
				<div className="mt-2 flex flex-wrap gap-1.5">
					{CONTACT_TOPICS.map((t) => (
						<button
							key={t.id}
							type="button"
							aria-pressed={topic === t.id}
							onClick={() => setTopic(t.id)}
							className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-sm text-ink-soft hover:border-ink-muted hover:text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-on-ink"
						>
							{t.label}
						</button>
					))}
				</div>
			</fieldset>

			<div>
				<label htmlFor="contact-message" className="text-[13px] font-semibold text-ink-soft">
					Your message
				</label>
				<textarea
					id="contact-message"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					rows={6}
					maxLength={4000}
					aria-invalid={touched && !messageOk}
					aria-describedby={touched && !messageOk ? "contact-message-error" : undefined}
					placeholder={
						topic === "problem"
							? "What were you doing, and what happened? Which phone and browser?"
							: "Write to us here."
					}
					className={`${FIELD} resize-y`}
				/>
				{touched && !messageOk && (
					<p id="contact-message-error" className="mt-1 text-sm text-negative">
						Tell us a little more, a sentence or two.
					</p>
				)}
				{topic === "problem" && (
					<p className="mt-1.5 text-sm text-ink-muted">
						Please don&apos;t paste group links or UPI IDs: we don&apos;t need them to help.
					</p>
				)}
			</div>

			<div>
				<label htmlFor="contact-email" className="text-[13px] font-semibold text-ink-soft">
					Your email
				</label>
				<input
					id="contact-email"
					type="email"
					inputMode="email"
					autoComplete="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="you@example.com"
					aria-invalid={touched && !emailOk}
					aria-describedby="contact-email-help"
					className={FIELD}
				/>
				<p id="contact-email-help" className={`mt-1 text-sm ${touched && !emailOk ? "text-negative" : "text-ink-muted"}`}>
					{touched && !emailOk
						? "Add an email we can reply to."
						: "Only used to reply to you. Never shared, never marketing."}
				</p>
			</div>

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

			{error && (
				<p className="text-sm text-negative" role="alert">
					{error}
				</p>
			)}

			<button type="submit" disabled={status === "sending"} className="btn-primary w-full !py-3 !text-base sm:w-auto sm:!px-8">
				{status === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
				{status === "sending" ? "Sending…" : "Send message"}
			</button>
		</form>
	);
};
