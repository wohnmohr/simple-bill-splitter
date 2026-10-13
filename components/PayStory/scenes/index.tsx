"use client";

import type { SplitLayout, SplitTemplate } from "@/utils/payStory";
import { useSplitDraft, type SplitDraft } from "./shared";
import { ReceiptScene } from "./Receipt";
import { LedgerScene } from "./Ledger";
import { MeterScene } from "./Meter";
import { ProfilesScene } from "./Profiles";
import { PassScene } from "./Pass";
import { ScoreboardScene } from "./Scoreboard";
import { JarScene } from "./Jar";
import { EnvelopeScene } from "./Envelope";

const SCENES: Record<SplitLayout, (p: { t: SplitTemplate; d: SplitDraft }) => React.ReactNode> = {
	receipt: ReceiptScene,
	ledger: LedgerScene,
	meter: MeterScene,
	profiles: ProfilesScene,
	pass: PassScene,
	scoreboard: ScoreboardScene,
	jar: JarScene,
	envelope: EnvelopeScene,
};

/** One split page body: shared state, scene-specific look. */
export const SplitScene = ({ template }: { template: SplitTemplate }) => {
	const d = useSplitDraft(template);
	const Scene = SCENES[template.layout];
	return (
		<form onSubmit={d.submit} noValidate>
			<Scene t={template} d={d} />
		</form>
	);
};
