"use client";

import { getTemplate, type PayRequest, type SplitLayout, type SplitTemplate } from "@/utils/payStory";
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
	return <View t={t} p={p} />;
};

/** Remount per split (not per payment) so a payer’s typed amount resets when a different link opens. */
export const SplitViewKeyed = (props: ViewProps) => {
	const r = props.req;
	return <SplitView key={[r.kind, r.title, r.upiId, r.target, r.people].join("|")} {...props} />;
};
