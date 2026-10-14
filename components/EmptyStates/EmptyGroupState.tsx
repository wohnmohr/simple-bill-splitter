import { Plus } from "lucide-react";

interface EmptyGroupStateProps {
	onCreateGroup: () => void;
}

const STEPS = [
	["Create a group", "A trip, a flat, a dinner — anything shared."],
	["Add who paid what", "Split equally or by percentage."],
	["Settle in fewest payments", "One-tap UPI links for every transfer."],
] as const;

export const EmptyGroupState = ({ onCreateGroup }: EmptyGroupStateProps) => {
	return (
		<section className="surface p-6 sm:p-8 lg:grid lg:grid-cols-2 lg:gap-x-12 lg:p-12">
			<div>
				<h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink">
					Split your first bill
				</h1>
				<p className="mt-2 max-w-md text-ink-soft">
					No signup. Everything stays on this device until you choose to share it.
				</p>
			</div>

			<ol className="mt-6 space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-center lg:rounded-2xl lg:bg-paper lg:p-6">
				{STEPS.map(([title, body], i) => (
					<li key={title} className="flex gap-3">
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong text-sm font-semibold tabular-nums text-ink-soft">
							{i + 1}
						</span>
						<span>
							<span className="block font-semibold text-ink">{title}</span>
							<span className="block text-sm text-ink-muted">{body}</span>
						</span>
					</li>
				))}
			</ol>

			<button
				onClick={onCreateGroup}
				className="btn-primary mt-7 w-full sm:w-auto lg:self-start lg:justify-self-start !px-6 !py-3 !text-base"
			>
				<Plus className="h-4 w-4" />
				Create a group
			</button>
		</section>
	);
};
