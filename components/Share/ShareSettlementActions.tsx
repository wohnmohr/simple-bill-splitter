"use client";

import { useState } from "react";
import { Check, Copy, Link2, MessageCircle, Share2 } from "lucide-react";
import { Currency, Expense, Person } from "@/types";
import { buildShareSnapshot, encodeShareUrl } from "@/utils/shareCodec";
import { formatCurrency } from "@/utils/formatting";
import { calculateSettlements } from "@/utils/calculations";
import { track, trackError } from "@/lib/analytics";

interface ShareSettlementActionsProps {
	name: string;
	people: Person[];
	expenses: Expense[];
	currency: Currency;
	/** When true, show a large primary CTA instead of icon buttons only */
	primary?: boolean;
	className?: string;
	source?: string;
}

export const ShareSettlementActions = ({
	name,
	people,
	expenses,
	currency,
	primary = false,
	className = "",
	source = "unknown",
}: ShareSettlementActionsProps) => {
	const [busy, setBusy] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const settlements = calculateSettlements(people, expenses);

	const buildShareText = (url: string) => {
		const lines =
			settlements.length === 0
				? ["Everyone is settled up!"]
				: settlements.map((s, i) => {
						const from = people.find((p) => p.id === s.from);
						const to = people.find((p) => p.id === s.to);
						const fromName = from?.name || "Unknown";
						const toName = to?.name || "Unknown";
						const amount = formatCurrency(s.amount, currency);
						const upi =
							currency.code === "INR" && to?.upiId
								? ` (UPI: ${to.upiId})`
								: "";
						return `${i + 1}. ${fromName} → ${toName}: ${amount}${upi}`;
					});

		return [
			`SplitBiller — ${name}`,
			"Settlement summary",
			"",
			...lines,
			"",
			"View the full split (encrypted in your browser, nothing stored on our servers):",
			url,
			"",
			`Split your own bills free, no signup: ${window.location.origin}`,
		].join("\n");
	};

	const createShareUrl = async () => {
		const snapshot = buildShareSnapshot({
			name,
			currency,
			members: people,
			expenses,
		});
		return encodeShareUrl(snapshot);
	};

	const reportShare = async (
		method: "native" | "copy" | "whatsapp",
		action: () => Promise<void>
	) => {
		track("share_settlement_clicked", {
			method,
			source,
			settlement_count: settlements.length,
			member_count: people.length,
			expense_count: expenses.length,
			currency: currency.code,
		});
		setBusy(true);
		setError(null);
		try {
			await action();
			track("share_settlement_succeeded", {
				method,
				source,
				settlement_count: settlements.length,
			});
		} catch (err) {
			if ((err as Error).name === "AbortError") return;
			track("share_settlement_failed", { method, source });
			trackError(err, { source: `share_${method}`, share_source: source });
			throw err;
		} finally {
			setBusy(false);
		}
	};

	const handleShare = async () => {
		try {
			await reportShare("native", async () => {
				const url = await createShareUrl();
				const text = buildShareText(url);

				if (navigator.share) {
					await navigator.share({
						title: `${name} — SplitBiller settlement`,
						text,
						url,
					});
				} else {
					await navigator.clipboard.writeText(url);
					setCopiedLink(true);
					setTimeout(() => setCopiedLink(false), 2500);
				}
			});
		} catch {
			setError("Could not create share link. Try again.");
		}
	};

	const handleCopyLink = async () => {
		try {
			await reportShare("copy", async () => {
				const url = await createShareUrl();
				await navigator.clipboard.writeText(url);
				setCopiedLink(true);
				setTimeout(() => setCopiedLink(false), 2500);
			});
		} catch {
			setError("Could not copy link.");
		}
	};

	const handleWhatsApp = async () => {
		try {
			await reportShare("whatsapp", async () => {
				const url = await createShareUrl();
				const text = buildShareText(url);
				window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
			});
		} catch {
			setError("Could not create share link.");
		}
	};

	if (primary) {
		return (
			<div className={`space-y-2.5 ${className}`}>
				<div className="grid grid-cols-2 gap-2">
					<button
						type="button"
						onClick={handleWhatsApp}
						disabled={busy}
						className="btn-primary !py-3"
					>
						<MessageCircle className="h-4 w-4" />
						WhatsApp
					</button>
					<button
						type="button"
						onClick={handleShare}
						disabled={busy || people.length === 0}
						className="btn-secondary !py-3"
					>
						<Share2 className="h-4 w-4" />
						{busy ? "Preparing…" : "Share…"}
					</button>
				</div>
				<button
					type="button"
					onClick={handleCopyLink}
					disabled={busy}
					className="btn-ghost w-full"
					aria-live="polite"
				>
					{copiedLink ? (
						<Check className="h-4 w-4 text-positive" />
					) : (
						<Link2 className="h-4 w-4" />
					)}
					{copiedLink ? "Link copied" : "Copy link"}
				</button>
				<p className="text-center text-xs text-ink-muted">
					Encrypted in your browser. We never see the expenses.
				</p>
				{error && (
					<p className="text-center text-sm text-negative" role="alert">
						{error}
					</p>
				)}
			</div>
		);
	}

	return (
		<div className={`flex gap-1 sm:gap-2 ${className}`}>
			<button
				type="button"
				onClick={handleShare}
				disabled={busy}
				className="icon-btn"
				title="Share settlement"
			>
				<Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
			</button>
			<button
				type="button"
				onClick={handleWhatsApp}
				disabled={busy}
				className="icon-btn"
				title="Share to WhatsApp"
			>
				<MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
			</button>
			<button
				type="button"
				onClick={handleCopyLink}
				disabled={busy}
				className="icon-btn"
				title={copiedLink ? "Copied!" : "Copy share link"}
			>
				{copiedLink ? (
					<Check className="h-4 w-4 sm:h-5 sm:w-5 text-positive" />
				) : (
					<Copy className="h-4 w-4 sm:h-5 sm:w-5" />
				)}
			</button>
			{error && <span className="sr-only">{error}</span>}
		</div>
	);
};
