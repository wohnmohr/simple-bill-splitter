import { Sparkles } from "lucide-react";
import type { Currency, Person } from "@/types";
import { type Award, awardDetail } from "@/utils/awards";
import { AWARD_ICONS } from "@/components/Group/awardIcons";

interface GroupAwardsProps {
	awards: Award[];
	people: Person[];
	currency: Currency;
	meId?: string | null;
	/** Opens the shareable card, once the group has settled. */
	onCard?: () => void;
}

/** The group's awards so far. They change hands as people add expenses and pay back. */
export const GroupAwards = ({ awards, people, currency, meId, onCard }: GroupAwardsProps) => {
	if (!awards.length) return null;
	const nameOf = (id: string) => (id === meId ? "You" : people.find((p) => p.id === id)?.name ?? "Someone");

	return (
		<section className="surface mt-3 overflow-hidden" aria-labelledby="awards-heading">
			<div className="flex items-center justify-between gap-3 px-4 pt-3.5">
				<h2 id="awards-heading" className="label-text">Awards</h2>
				{onCard && (
					<button type="button" onClick={onCard} className="flex items-center gap-1 text-sm font-semibold text-brand-700">
						<Sparkles className="h-4 w-4" aria-hidden />
						Get your card
					</button>
				)}
			</div>
			<ul className="divide-y divide-line">
				{awards.map((a) => (
					<li key={a.id + a.personId} className="flex items-center gap-3 px-4 py-2.5">
						<AwardBadge id={a.id} />
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold text-ink">{a.title}</p>
							<p className="truncate text-xs text-ink-muted">{awardDetail(a, currency)}</p>
						</div>
						<span className={`max-w-[40%] shrink-0 truncate text-sm ${a.personId === meId ? "font-semibold text-brand-700" : "text-ink-soft"}`}>
							{nameOf(a.personId)}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
};

/** An award's icon on its color. */
export const AwardBadge = ({ id }: { id: Award["id"] }) => {
	const { Icon, color } = AWARD_ICONS[id];
	return (
		<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color }} aria-hidden>
			<Icon className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
		</span>
	);
};
