import { C, OG_SIZE, PayButton, Surface, ogCard } from "@/lib/ogCard";

export const runtime = "nodejs";

export const alt = "SplitBiller: split bills in rupees and settle with UPI. No signup, no app.";
export const size = OG_SIZE;
export const contentType = "image/png";

const Arrow = () => (
	<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.inkMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<path d="M5 12h14M13 6l6 6-6 6" />
	</svg>
);

const Row = ({ from, to, amount, pay }: { from: string; to: string; amount: string; pay?: boolean }) => (
	<div style={{ display: "flex", flexDirection: "column", marginTop: 16, padding: "18px 20px", border: `2px solid ${C.line}`, borderRadius: 18 }}>
		<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26, fontWeight: 600 }}>
			<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
				{from}
				<Arrow />
				{to}
			</div>
			<span style={{ fontFamily: "Fraunces" }}>{amount}</span>
		</div>
		{pay && (
			<PayButton>
				<span>Pay</span>
				<span style={{ fontFamily: "Fraunces" }}>{amount}</span>
				<span>with UPI</span>
			</PayButton>
		)}
	</div>
);

/** The site's preview: the hero line beside the settle-up screen it leads to (as on the landing page). */
export default function OpengraphImage() {
	return ogCard({
		title: "Split bills in ₹, settle with UPI",
		sub: "Who owes whom in seconds. No signup, no app download.",
		visual: (
			<Surface>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<span style={{ fontFamily: "Fraunces", fontSize: 34 }}>Goa trip</span>
						<span style={{ fontSize: 22, color: C.inkMuted, marginTop: 4 }}>4 members · 11 expenses</span>
					</div>
					<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
						<span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "1.5px", color: C.inkMuted }}>TOTAL</span>
						<span style={{ fontFamily: "Fraunces", fontSize: 28, marginTop: 2 }}>₹38,460</span>
					</div>
				</div>
				<Row from="Rohan" to="Priya" amount="₹6,215" pay />
				<Row from="Aisha" to="Priya" amount="₹2,940" />
			</Surface>
		),
	});
}
