"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import type { Group } from "@/types";
import type { Award } from "@/utils/awards";
import { groupSummary } from "@/utils/calculations";
import { drawSettledCard } from "@/utils/settledCard";
import { SITE_URL } from "@/lib/site";
import { track } from "@/lib/analytics";
import { Modal } from "@/components/UI/Modal";

interface SettledCardModalProps {
	isOpen: boolean;
	onClose: () => void;
	group: Group;
	awards: Award[];
}

const SHARE_TEXT = `All settled! We split it on SplitBiller: ${SITE_URL}/?utm_source=settled_card`;

/**
 * A story card of a settled group, drawn on this phone and handed straight to
 * the share sheet. It names people by their shared names (never this device's
 * nicknames), and money can be left off.
 */
export const SettledCardModal = ({ isOpen, onClose, group, awards }: SettledCardModalProps) => {
	// The modal mounts its body after opening, so the canvas arrives through a callback ref.
	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
	const sharers = group.members.filter((p) => awards.some((a) => a.personId === p.id));
	const [forId, setForId] = useState(group.meId ?? sharers[0]?.id ?? "");
	const [amounts, setAmounts] = useState(true);
	const { total, count, days, sharers: people } = groupSummary(group.expenses);

	useEffect(() => {
		if (!isOpen) return;
		track("settled_card_opened");
		setForId(group.meId ?? sharers[0]?.id ?? "");
		// Only on opening; the picker takes over from there.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	useEffect(() => {
		if (!canvas) return;
		let live = true;
		document.fonts.ready.then(() => {
			if (!live) return;
			drawSettledCard(canvas, {
				groupName: group.name,
				currency: group.currency,
				total,
				people,
				count,
				days,
				awards,
				forId,
				nameOf: (id) => group.members.find((p) => p.id === id)?.name ?? "Someone",
				amounts,
			});
		});
		return () => {
			live = false;
		};
	}, [canvas, group, awards, forId, amounts, total, people, count, days]);

	const share = () =>
		canvas?.toBlob(async (blob) => {
			if (!blob) return;
			const file = new File([blob], "splitbiller-settled.png", { type: "image/png" });
			if (navigator.canShare?.({ files: [file] })) {
				try {
					await navigator.share({ files: [file], text: SHARE_TEXT });
					track("settled_card_shared", { method: "share", amounts });
				} catch {
					/* closed the share sheet */
				}
				return;
			}
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = file.name;
			a.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			track("settled_card_shared", { method: "download", amounts });
		}, "image/png");

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Your card">
			<div className="space-y-3 pb-2">
				<canvas
					ref={setCanvas}
					className="mx-auto block aspect-[9/16] w-full max-w-[280px] rounded-2xl shadow-lg"
					role="img"
					aria-label={`Story card for ${group.name}`}
				/>
				<div className="flex flex-wrap items-center gap-3">
					{sharers.length > 1 && (
						<label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink-muted">
							Card for
							<select value={forId} onChange={(e) => setForId(e.target.value)} className="min-h-9 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-2 font-medium text-ink">
								{sharers.map((p) => (
									<option key={p.id} value={p.id}>
										{p.id === group.meId ? `${p.name} (you)` : p.name}
									</option>
								))}
							</select>
						</label>
					)}
					<label className="flex items-center gap-2 text-sm text-ink-soft">
						<input type="checkbox" checked={amounts} onChange={(e) => setAmounts(e.target.checked)} className="h-4 w-4 accent-brand-700" />
						Show amounts
					</label>
				</div>
				<button type="button" onClick={share} className="btn-primary w-full !py-3">
					<Share2 className="h-4 w-4" />
					Share to your story
				</button>
				<p className="text-center text-xs text-ink-muted">Made on your phone. Nothing is uploaded.</p>
			</div>
		</Modal>
	);
};
