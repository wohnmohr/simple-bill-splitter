"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, IndianRupee } from "lucide-react";
import { Person, Settlement, Currency } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { buildUpiLink } from "@/utils/upi";
import { track } from "@/lib/analytics";

interface UpiSettlementActionsProps {
	settlement: Settlement;
	from?: Person;
	to?: Person;
	currency: Currency;
	groupName: string;
	onSaveUpi?: (personId: string, upiId: string) => void;
}

export const UpiSettlementActions = ({
	settlement,
	from,
	to,
	currency,
	groupName,
	onSaveUpi,
}: UpiSettlementActionsProps) => {
	const [draftUpi, setDraftUpi] = useState(to?.upiId || "");
	const [copied, setCopied] = useState(false);
	const [editing, setEditing] = useState(false);

	if (currency.code !== "INR" || !to) return null;

	const upiId = to.upiId?.trim() || "";
	const link = upiId
		? buildUpiLink({
				pa: upiId,
				pn: to.name,
				am: settlement.amount,
				tn: `${groupName} — ${from?.name || "split"}`,
			})
		: null;

	const handleCopy = async () => {
		if (!upiId) return;
		try {
			await navigator.clipboard.writeText(upiId);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* ignore */
		}
	};

	const handleSave = () => {
		if (!onSaveUpi) return;
		onSaveUpi(to.id, draftUpi.trim());
		setEditing(false);
	};

	if (!upiId && !onSaveUpi) {
		return (
			<p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-2.5 py-2">
				Add {to.name}&apos;s UPI ID in Members to enable Pay.
			</p>
		);
	}

	if (!upiId || editing) {
		return (
			<div className="space-y-2 pt-1">
				<label className="text-xs font-medium text-gray-600">
					{to.name}&apos;s UPI ID
				</label>
				<div className="flex gap-2">
					<input
						value={draftUpi}
						onChange={(e) => setDraftUpi(e.target.value)}
						placeholder="name@upi / name@okaxis"
						className="flex-1 min-w-0 rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						inputMode="email"
						autoComplete="off"
						data-ph-mask
					/>
					<button
						type="button"
						onClick={handleSave}
						disabled={!draftUpi.trim().includes("@")}
						className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50 touch-manipulation"
					>
						Save
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2 pt-1">
			<div className="flex items-center gap-2 min-w-0">
				<span className="text-xs text-gray-500 truncate flex-1">
					UPI: {upiId}
				</span>
				<button
					type="button"
					onClick={handleCopy}
					className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-white/80 touch-manipulation"
					aria-label="Copy UPI ID"
				>
					{copied ? (
						<Check className="h-3.5 w-3.5 text-green-600" />
					) : (
						<Copy className="h-3.5 w-3.5" />
					)}
				</button>
				{onSaveUpi && (
					<button
						type="button"
						onClick={() => {
							setDraftUpi(upiId);
							setEditing(true);
						}}
						className="shrink-0 text-xs font-medium text-indigo-600 touch-manipulation"
					>
						Edit
					</button>
				)}
			</div>
			{link && (
				<a
					href={link}
					onClick={() => track("upi_pay_link_clicked")}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00B894] px-3 py-2.5 text-sm font-semibold text-white shadow-sm active:opacity-90 touch-manipulation"
				>
					<IndianRupee className="h-4 w-4" />
					Pay {formatCurrency(settlement.amount, currency)} via UPI
					<ExternalLink className="h-3.5 w-3.5 opacity-90" />
				</a>
			)}
		</div>
	);
};
