import { Archive, ArrowRight, RotateCcw } from "lucide-react";
import { Group } from "@/types";
import { groupSummary } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatting";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

interface TripCardProps {
	group: Group;
	/** Close the group (offered once everyone has settled). */
	onClose: () => void;
	onReopen: () => void;
	/** A new group with the same people. */
	onStartNext: () => void;
}

/**
 * The end of a trip: once everyone has settled, offers to close the group with
 * its final numbers; once closed, shows them and leads into the next one.
 */
export const TripCard = ({ group, onClose, onReopen, onStartNext }: TripCardProps) => {
	const { total, count, days, perPerson } = groupSummary(group.expenses, group.members.length);
	const closed = !!group.closedAt;
	const facts = [
		`${formatCurrency(total, group.currency)} spent`,
		plural(count, "expense"),
		...(days > 1 ? [plural(days, "day")] : []),
		...(group.members.length > 1 ? [`about ${formatCurrency(Math.round(perPerson), group.currency)} each`] : []),
	];

	return (
		<section className="surface p-4 sm:p-5" aria-label={closed ? "Closed group" : "Close this group"}>
			<div className="flex items-start gap-3">
				<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50">
					<Archive className="h-4 w-4 text-brand-700" aria-hidden />
				</span>
				<div className="min-w-0">
					<h2 className="font-semibold text-ink">
						{closed
							? `Closed on ${new Date(group.closedAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
							: `All done with ${group.name}?`}
					</h2>
					<p className="mt-0.5 text-sm text-ink-muted">{facts.join(" · ")}</p>
					{!closed && (
						<p className="mt-1 text-sm text-ink-muted">
							Close it to keep the record, and start the next one with the same people.
						</p>
					)}
				</div>
			</div>
			<div className="mt-4 flex gap-2">
				{closed ? (
					<button type="button" onClick={onReopen} className="btn-ghost">
						<RotateCcw className="h-4 w-4" />
						Reopen
					</button>
				) : (
					<button type="button" onClick={onClose} className="btn-secondary">
						Close the group
					</button>
				)}
				<button type="button" onClick={onStartNext} className="btn-primary flex-1">
					Start the next one
					<ArrowRight className="h-4 w-4" />
				</button>
			</div>
		</section>
	);
};
