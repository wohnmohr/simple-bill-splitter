"use client";

import { Check } from "lucide-react";
import { Modal } from "@/components/UI/Modal";
import type { Group } from "@/types";
import { DEFAULT_THEME_ID, THEMES, type Theme } from "@/utils/themes";
import { track } from "@/lib/analytics";

/** A miniature of the group screen in the theme's own colors. */
const Preview = ({ theme, symbol }: { theme: Theme; symbol: string }) => {
	const c = theme.colors;
	return (
		<div className="rounded-xl p-2.5" style={{ background: c.paper }} aria-hidden>
			<div className="rounded-lg border p-2" style={{ background: c.surface, borderColor: c.line }}>
				<p className="font-display text-sm font-semibold leading-tight" style={{ color: c.ink }}>Goa trip</p>
				<p className="mt-1 flex justify-between text-[11px] leading-snug">
					<span style={{ color: c["ink-muted"] }}>Asha</span>
					<span className="font-semibold tabular-nums" style={{ color: c.positive }}>+{symbol}800</span>
				</p>
				<p className="flex justify-between text-[11px] leading-snug">
					<span style={{ color: c["ink-muted"] }}>Ben</span>
					<span className="font-semibold tabular-nums" style={{ color: c.ink }}>−{symbol}400</span>
				</p>
			</div>
			<p className="mt-2 rounded-lg py-1 text-center text-[11px] font-semibold" style={{ background: c["brand-700"], color: c["on-brand"] }}>
				Settle up
			</p>
		</div>
	);
};

type Props = {
	isOpen: boolean;
	onClose: () => void;
	group: Group;
	onChange: (groupId: string, theme: string | undefined) => void;
};

/** Picks the group's theme. Changes show straight away; synced groups share it with everyone. */
export const ThemeModal = ({ isOpen, onClose, group, onChange }: Props) => {
	const current = group.theme ?? DEFAULT_THEME_ID;
	const pick = (id: string) => {
		if (id === current) return;
		onChange(group.id, id === DEFAULT_THEME_ID ? undefined : id);
		track("group_theme_changed", { theme: id, synced: Boolean(group.sync) });
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Group theme">
			<div className="pb-2">
				<p className="text-sm text-ink-muted">
					{group.sync
						? "Everyone in this group sees the theme you pick. It's stored encrypted with the group."
						: "Applies to this group. Share the group and everyone in it will see it too."}
				</p>
				<div role="radiogroup" aria-label="Theme" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{THEMES.map((theme) => {
						const selected = theme.id === current;
						return (
							<button
								key={theme.id}
								type="button"
								role="radio"
								aria-checked={selected}
								onClick={() => pick(theme.id)}
								className={`rounded-2xl border-2 p-1.5 text-left transition-colors ${
									selected ? "border-brand-700" : "border-transparent hover:border-line-strong"
								}`}
							>
								<Preview theme={theme} symbol={group.currency.symbol} />
								<span className="mt-1.5 flex items-center justify-between gap-1 px-1">
									<span className="min-w-0">
										<span className="block truncate text-sm font-semibold text-ink">{theme.name}</span>
										<span className="block truncate text-xs text-ink-muted">{theme.tagline}</span>
									</span>
									{selected && (
										<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-700 text-on-brand">
											<Check className="h-3 w-3" strokeWidth={3} />
										</span>
									)}
								</span>
							</button>
						);
					})}
				</div>
				<button type="button" onClick={onClose} className="btn-primary mt-5 w-full">
					Done
				</button>
			</div>
		</Modal>
	);
};
