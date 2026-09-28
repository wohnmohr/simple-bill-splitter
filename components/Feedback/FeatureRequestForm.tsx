"use client";

import { useState } from "react";
import Link from "next/link";
import { TextInput } from "@mantine/core";
import { Check, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { collectFeedbackContext } from "@/lib/feedbackContext";

const IDEAS = [
	"Split by exact amounts",
	"Recurring rent every month",
	"Scan a bill photo",
	"Sync a group across phones",
];

export const FeatureRequestForm = () => {
	const [title, setTitle] = useState("");
	const [details, setDetails] = useState("");
	const [email, setEmail] = useState("");
	const [honeypot, setHoneypot] = useState("");
	const [touched, setTouched] = useState(false);
	const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
	const [error, setError] = useState<string | null>(null);

	const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
	const titleOk = title.trim().length >= 4;

	const submit = async () => {
		setTouched(true);
		if (!titleOk || !emailOk || status === "sending") return;
		setStatus("sending");
		setError(null);
		try {
			const res = await fetch("/api/feature-requests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					details,
					email,
					website: honeypot,
					context: collectFeedbackContext({ trigger: "feature_request" }),
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || "Couldn't send your request. Try again.");
			track("feature_request_submitted", { has_details: details.trim().length > 0 });
			setStatus("sent");
		} catch (err) {
			setStatus("idle");
			setError((err as Error).message);
		}
	};

	if (status === "sent") {
		return (
			<div className="surface p-6 sm:p-8 text-center" role="status">
				<span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-positive-soft">
					<Check className="h-6 w-6 text-positive" strokeWidth={2.5} />
				</span>
				<h2 className="mt-4 font-display text-2xl font-semibold text-ink">Request received</h2>
				<p className="mx-auto mt-2 max-w-sm text-ink-soft">
					We&apos;ll write to <span className="font-medium text-ink">{email.trim()}</span> if we
					want to understand it better or when it ships.
				</p>
				<div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
					<button
						type="button"
						onClick={() => {
							setTitle("");
							setDetails("");
							setTouched(false);
							setStatus("idle");
						}}
						className="btn-secondary"
					>
						Request something else
					</button>
					<Link href="/dashboard" className="btn-primary">
						Back to my groups
					</Link>
				</div>
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
			<div>
				<TextInput
					label="What should SplitBiller do?"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="e.g. Split a bill by exact amounts"
					maxLength={120}
					error={touched && !titleOk ? "Describe the feature in a few words." : undefined}
					data-autofocus
				/>
				<div className="mt-2 flex flex-wrap gap-1.5" aria-label="Common requests">
					{IDEAS.map((idea) => (
						<button
							key={idea}
							type="button"
							onClick={() => setTitle(idea)}
							className="rounded-full border border-line-strong bg-white px-3 py-1 text-sm text-ink-soft hover:border-ink-muted hover:text-ink"
						>
							{idea}
						</button>
					))}
				</div>
			</div>

			<div>
				<label htmlFor="fr-details" className="text-[13px] font-semibold text-ink-soft">
					When would you use it?{" "}
					<span className="font-normal text-ink-muted">(optional, but it helps most)</span>
				</label>
				<textarea
					id="fr-details"
					value={details}
					onChange={(e) => setDetails(e.target.value)}
					rows={5}
					maxLength={4000}
					placeholder="Tell us the situation — the trip, the flat, the dinner — and what you'd expect to happen."
					className="mt-1.5 w-full resize-y rounded-xl border border-line-strong bg-white px-3 py-2.5 text-base text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
				/>
			</div>

			<div>
				<TextInput
					label="Your email"
					type="email"
					inputMode="email"
					autoComplete="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="you@example.com"
					error={touched && !emailOk ? "Add an email we can reach you at." : undefined}
					description="Only used to talk to you about this request. Never shared, never marketing."
				/>
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

			<button
				type="submit"
				disabled={status === "sending"}
				className="btn-primary w-full !py-3 !text-base sm:w-auto sm:!px-8"
			>
				{status === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
				{status === "sending" ? "Sending…" : "Send request"}
			</button>
		</form>
	);
};
