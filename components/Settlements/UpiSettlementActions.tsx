"use client";

import { useState } from "react";
import { Copy, Check, IndianRupee } from "lucide-react";
import { Person, Settlement, Currency } from "@/types";
import { formatCurrency } from "@/utils/formatting";
import { buildUpiLink, isValidUpiId } from "@/utils/upi";
import { track } from "@/lib/analytics";
import { UpiQr, useCanOpenUpiApps } from "@/components/Settlements/UpiQr";

interface UpiSettlementActionsProps {
	settlement: Settlement;
	from?: Person;
	to?: Person;
	currency: Currency;
	groupName: string;
	onSaveUpi?: (personId: string, upiId: string) => void;
	/** Called when the Pay link is tapped, before the UPI app opens. */
	onPay?: () => void;
}

export const UpiSettlementActions = ({
	settlement,
	from,
	to,
	currency,
	groupName,
	onSaveUpi,
	onPay,
}: UpiSettlementActionsProps) => {
	const [draftUpi, setDraftUpi] = useState(to?.upiId || "");
	const [copied, setCopied] = useState(false);
	const [editing, setEditing] = useState(false);
	const canOpenApps = useCanOpenUpiApps();

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
			<p className="text-sm text-ink-muted">
				No UPI ID for {to.name} — pay them directly.
			</p>
		);
	}

	if (!upiId || editing) {
		const inputId = `upi-${settlement.from}-${settlement.to}`;
		const valid = isValidUpiId(draftUpi);
		return (
			<form
				className="space-y-1.5"
				onSubmit={(e) => {
					e.preventDefault();
					if (valid) handleSave();
				}}
			>
				<label htmlFor={inputId} className="block text-sm font-medium text-ink-soft">
					{to.name}&apos;s UPI ID
				</label>
				<div className="flex gap-2">
					<input
						id={inputId}
						value={draftUpi}
						onChange={(e) => setDraftUpi(e.target.value)}
						placeholder="name@okaxis"
						className="h-11 flex-1 min-w-0 rounded-xl border border-line-strong bg-white px-3 text-base text-ink placeholder:text-[#767080] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
						inputMode="email"
						autoComplete="off"
						autoCapitalize="none"
						spellCheck={false}
						data-ph-mask
					/>
					<button type="submit" disabled={!valid} className="btn-primary !h-11 shrink-0">
						Save
					</button>
					{editing && (
						<button
							type="button"
							onClick={() => setEditing(false)}
							className="btn-ghost !h-11 shrink-0"
						>
							Cancel
						</button>
					)}
				</div>
			</form>
		);
	}

	return (
		<div className="space-y-2.5">
			<div className="flex items-center gap-1 min-w-0 text-sm">
				<span className="text-ink-muted shrink-0">UPI</span>
				<span className="truncate font-medium text-ink-soft ml-1">{upiId}</span>
				<button
					type="button"
					onClick={handleCopy}
					className="icon-btn !h-8 !w-8"
					aria-label={copied ? "UPI ID copied" : "Copy UPI ID"}
				>
					{copied ? (
						<Check className="h-4 w-4 text-positive" />
					) : (
						<Copy className="h-4 w-4" />
					)}
				</button>
				{onSaveUpi && (
					<button
						type="button"
						onClick={() => {
							setDraftUpi(upiId);
							setEditing(true);
						}}
						className="ml-auto shrink-0 text-sm font-medium text-brand-700 hover:underline"
					>
						Change
					</button>
				)}
			</div>
			<span className="sr-only" aria-live="polite">
				{copied ? "UPI ID copied" : ""}
			</span>
			{link && canOpenApps === false && (
				<div className="flex items-center gap-4 rounded-xl bg-paper p-3">
					<UpiQr
						link={link}
						label={`UPI QR code to pay ${to.name} ${formatCurrency(settlement.amount, currency)}`}
					/>
					<div className="min-w-0 text-sm">
						<p className="font-semibold text-ink">
							Scan to pay {formatCurrency(settlement.amount, currency)}
						</p>
						<p className="mt-1 text-ink-muted">
							Open GPay, PhonePe, Paytm or any UPI app on your phone and scan.
							The amount is filled in for you.
						</p>
					</div>
				</div>
			)}
			{link && canOpenApps !== false && (
				<a
					href={link}
					onClick={() => {
						track("upi_pay_link_clicked");
						onPay?.();
					}}
					className="btn-primary w-full !py-3"
				>
					<IndianRupee className="h-4 w-4" />
					Pay {formatCurrency(settlement.amount, currency)} with UPI
				</a>
			)}
		</div>
	);
};
