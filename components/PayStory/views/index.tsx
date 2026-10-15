"use client";

import { getTemplate, type PayRequest, type SplitLayout, type SplitTemplate } from "@/utils/payStory";
import { track } from "@/lib/analytics";
import { splitToGroup } from "@/utils/billGroup";
import { personKey } from "@/utils/billClaims";
import { SaveAsGroupCard } from "../SaveAsGroupCard";
import { usePay, type PayOptions, type PayState } from "./shared";
import { ReceiptView } from "./Receipt";
import { LedgerView } from "./Ledger";
import { MeterView } from "./Meter";
import { ProfilesView } from "./Profiles";
import { PassView } from "./Pass";
import { ScoreboardView } from "./Scoreboard";
import { JarView } from "./Jar";
import { EnvelopeView } from "./Envelope";

const VIEWS: Record<SplitLayout, (p: { t: SplitTemplate; p: PayState }) => React.ReactNode> = {
	receipt: ReceiptView,
	ledger: LedgerView,
	meter: MeterView,
	profiles: ProfilesView,
	pass: PassView,
	scoreboard: ScoreboardView,
	jar: JarView,
	envelope: EnvelopeView,
};

/** A shared split, shown in the same scene the organiser made it in. */
type ViewProps = { req: PayRequest; onChange: (r: PayRequest) => void } & PayOptions;

export const SplitView = ({ req, onChange, ...opts }: ViewProps) => {
	const t = getTemplate(req.kind);
	const p = usePay(t, req, onChange, opts);
	const View = VIEWS[t.layout];
	const friendsPaid = req.paid.some(([name]) => personKey(name) && personKey(name) !== personKey(req.name));
	return (
		<>
			<View t={t} p={p} />
			{/* The organiser's device has the whole picture, so the offer is theirs. */}
			{p.organiser && friendsPaid && (
				<div className="mx-auto max-w-xl px-4 py-8">
					<SaveAsGroupCard
						heading="Keep splitting with these friends"
						body="Save them as a group, with what everyone has paid. Next time, add the expense there and they each pay their share from one link."
						toGroup={() => splitToGroup(req)}
						emptyMessage="Nobody has paid yet."
						onSaved={(snapshot) => track("split_saved_as_group", { template: t.id, members: snapshot.members.length, done: p.done })}
					/>
				</div>
			)}
		</>
	);
};

/** Remount per split (not per payment) so a payer’s typed amount resets when a different link opens. */
export const SplitViewKeyed = (props: ViewProps) => {
	const r = props.req;
	return <SplitView key={[r.kind, r.title, r.upiId, r.target, r.people].join("|")} {...props} />;
};
