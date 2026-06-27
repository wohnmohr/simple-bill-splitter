"use client";

import { useState } from "react";
import { Settlement, Person, Currency } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { Copy, MessageCircle, Check, Share2, ArrowRight } from "lucide-react";

interface SettlementListProps {
	settlements: Settlement[];
	people: Person[];
	currency: Currency;
}

export const SettlementList = ({
	settlements,
	people,
	currency,
}: SettlementListProps) => {
	const [copied, setCopied] = useState(false);

	const getPersonName = (personId: string) => {
		return people.find((p) => p.id === personId)?.name || "Unknown";
	};

	const formatSettlementsText = () => {
		if (settlements.length === 0) {
			return "No settlements needed. Everyone is balanced!";
		}

		const brandHeader = "💸 SplitBiller\n" + "=".repeat(30) + "\n";
		const header = "💰 Settlement Summary\n\n";

		const lines = settlements.map((settlement, index) => {
			const fromName = getPersonName(settlement.from);
			const toName = getPersonName(settlement.to);
			const amount = formatCurrency(settlement.amount, currency);
			return `${index + 1}. ${fromName} → ${toName}: ${amount}`;
		});

		const footer = `\n${"=".repeat(30)}\nTotal transactions: ${
			settlements.length
		}\n\nSplit expenses easily with SplitBiller\nNo login required • Free to use`;

		return brandHeader + header + lines.join("\n") + footer;
	};

	const handleCopy = async () => {
		try {
			const text = formatSettlementsText();
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleWhatsAppShare = () => {
		const text = formatSettlementsText();
		const encodedText = encodeURIComponent(text);
		const whatsappUrl = `https://wa.me/?text=${encodedText}`;
		window.open(whatsappUrl, "_blank");
	};

	const handleShare = async () => {
		const text = formatSettlementsText();
		try {
			if (navigator.share) {
				await navigator.share({
					text: text,
				});
			} else {
				// Fallback to copy if Web Share API is not available
				await navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}
		} catch (err) {
			// User cancelled or error occurred
			if ((err as Error).name !== "AbortError") {
				console.error("Failed to share:", err);
			}
		}
	};

	if (settlements.length === 0) {
		return (
			<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-6 sm:p-8 text-center">
				<Check className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
				<p className="text-sm sm:text-base font-semibold text-gray-700">
					All settled up!
				</p>
				<p className="text-xs sm:text-sm text-gray-500 mt-1">
					No payments needed — everyone is balanced.
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/50 p-3 sm:p-4">
			<div className="flex items-center justify-between gap-2 mb-3">
				<h3 className="text-sm sm:text-base font-bold text-gray-800">
					Who pays whom
				</h3>
				<div className="flex gap-1 sm:gap-2">
				<button
					onClick={handleShare}
					className="p-1.5 sm:p-2 text-gray-600 hover:text-indigo-600 active:text-indigo-700 transition-colors touch-manipulation rounded-lg hover:bg-indigo-50 active:bg-indigo-100"
					title="Share settlements"
				>
					<Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
				</button>
				<button
					onClick={handleWhatsAppShare}
					className="p-1.5 sm:p-2 text-gray-600 hover:text-green-600 active:text-green-700 transition-colors touch-manipulation rounded-lg hover:bg-green-50 active:bg-green-100"
					title="Share to WhatsApp"
				>
					<MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
				</button>
				<button
					onClick={handleCopy}
					className="p-1.5 sm:p-2 text-gray-600 hover:text-indigo-600 active:text-indigo-700 transition-colors touch-manipulation rounded-lg hover:bg-indigo-50 active:bg-indigo-100"
					title={copied ? "Copied!" : "Copy settlements"}
				>
					{copied ? (
						<Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
					) : (
						<Copy className="h-4 w-4 sm:h-5 sm:w-5" />
					)}
				</button>
				</div>
			</div>
			<div className="space-y-2">
				{settlements.map((settlement, index) => (
					<div
						key={index}
						className="border-2 border-indigo-200 rounded-xl p-2.5 sm:p-3 bg-gradient-to-r from-indigo-50 to-purple-50"
					>
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-1.5 sm:gap-2 min-w-0 text-xs sm:text-sm text-gray-700">
								<span className="font-bold truncate max-w-[35%]">
									{getPersonName(settlement.from)}
								</span>
								<ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500 shrink-0" />
								<span className="font-bold truncate max-w-[35%]">
									{getPersonName(settlement.to)}
								</span>
							</div>
							<span className="text-sm sm:text-base font-bold shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
								{formatCurrency(settlement.amount, currency)}
							</span>
						</div>
					</div>
				))}
			</div>
			<p className="text-xs text-gray-500 mt-3 sm:mt-4">
				Simplified to the fewest possible payments.
			</p>
		</div>
	);
};
