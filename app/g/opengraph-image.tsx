import { Avatar, C, OG_SIZE, PayButton, Surface, ogCard } from "@/lib/ogCard";

export const runtime = "nodejs";

export const alt = "Open your group on SplitBiller: see what you owe and settle up.";
export const size = OG_SIZE;
export const contentType = "image/png";

const Lock = () => (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.positive} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<rect x="4" y="11" width="16" height="10" rx="2" />
		<path d="M8 11V7a4 4 0 0 1 8 0v4" />
	</svg>
);

/**
 * Group links: invites and payment reminders. The group itself is encrypted
 * in the link's #fragment, which never reaches us, so the card shows no names
 * or amounts: just what the link opens.
 */
export default function GroupOpengraphImage() {
	return ogCard({
		title: "Your group is waiting",
		sub: "See what you owe, settle up and add expenses together.",
		visual: (
			<Surface>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
					<div style={{ display: "flex", paddingLeft: 10 }}>
						<Avatar letter="P" shade={C.brand700} />
						<Avatar letter="R" shade="#9a6582" />
						<Avatar letter="A" shade="#4f454a" />
						<Avatar letter="+2" shade={C.inkMuted} />
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: C.positiveSoft, color: C.positive, fontSize: 20, fontWeight: 600 }}>
						<Lock />
						Encrypted
					</div>
				</div>
				<div style={{ display: "flex", marginTop: 26, padding: 6, borderRadius: 16, background: C.brand50, fontSize: 22, fontWeight: 600, color: C.inkMuted }}>
					<div style={{ display: "flex", flex: 1, justifyContent: "center", padding: "10px 0" }}>Expenses</div>
					<div style={{ display: "flex", flex: 1, justifyContent: "center", padding: "10px 0" }}>Balances</div>
					<div style={{ display: "flex", flex: 1, justifyContent: "center", padding: "10px 0", borderRadius: 12, background: C.surface, color: C.ink, border: `2px solid ${C.line}` }}>Settle up</div>
				</div>
				<span style={{ marginTop: 26, fontSize: 28, fontWeight: 600 }}>See your share and settle up</span>
				<span style={{ marginTop: 4, fontSize: 21, color: C.inkMuted }}>End-to-end encrypted, no signup</span>
				<PayButton>Open the group</PayButton>
			</Surface>
		),
	});
}
