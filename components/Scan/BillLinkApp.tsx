"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { OrderSplit } from "@/components/Scan/OrderSplit";
import { ScanOrderButton } from "@/components/Scan/ScanOrderButton";
import { useOrderScan } from "@/components/Scan/useOrderScan";
import { BILL_DRAFT_KEY, draftFromOrder, draftTotals, emptyDraft, num, type DraftOrder } from "@/components/Scan/draft";
import { billTarget, MAX_ITEMS, type BillItem } from "@/utils/billClaims";
import type { PayRequest } from "@/utils/payStory";
import { SPLIT_TTL_DAYS, createCloudSplit } from "@/utils/splitCloud";
import { rememberOrganiser } from "@/utils/splitOrganiser";
import { isValidUpiId } from "@/utils/upi";
import { CURRENCIES } from "@/constants";

const INR = CURRENCIES.find((c) => c.code === "INR")!;

const field =
	"w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-base text-ink placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100";

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
	<section className="surface p-4 sm:p-5" aria-labelledby={`step-${n}`}>
		<h2 id={`step-${n}`} className="mb-3 flex items-center gap-2.5 font-semibold text-ink">
			<span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-sm tabular-nums text-brand-700">{n}</span>
			{title}
		</h2>
		{children}
	</section>
);

/** The organiser's side of "tap what you ate": scan the bill, check it, share one link. */
export const BillLinkApp = () => {
	const [draft, setDraft] = useState<DraftOrder>(emptyDraft);
	const [scanned, setScanned] = useState(false);
	const [name, setName] = useState("");
	const [upiId, setUpiId] = useState("");
	const [error, setError] = useState("");
	const [creating, setCreating] = useState(false);
	const { state, scan } = useOrderScan("bill-link");

	// Picked up from the order splitter's "let friends pick" button.
	useEffect(() => {
		try {
			const handed = sessionStorage.getItem(BILL_DRAFT_KEY);
			if (!handed) return;
			sessionStorage.removeItem(BILL_DRAFT_KEY);
			const d = JSON.parse(handed) as DraftOrder;
			if (Array.isArray(d?.items) && Array.isArray(d.charges)) setDraft({ ...d, items: d.items.map((i) => ({ ...i, people: [] })) });
		} catch {
			/* nothing usable handed over */
		}
	}, []);

	const read = async (file: File) => {
		const order = await scan(file);
		if (order) {
			setDraft(draftFromOrder(order));
			setScanned(true);
		}
	};

	// Desktop: paste a screenshot straight onto the page.
	useEffect(() => {
		const onPaste = (e: ClipboardEvent) => {
			const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
			if (file) {
				e.preventDefault();
				void read(file);
			}
		};
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	});

	const items: BillItem[] = draft.items
		.map((i): BillItem => [i.name.trim(), Math.round(num(i.amount) * 100) / 100])
		.filter(([, a]) => a > 0);
	const { total } = draftTotals(draft);
	const target = billTarget(total);

	const create = async (e: React.FormEvent) => {
		e.preventDefault();
		if (creating) return;
		if (!items.length) return setError("Add at least one item with a price.");
		if (items.length > MAX_ITEMS) return setError(`That’s more than ${MAX_ITEMS} items. Combine a few small ones.`);
		if (!(target >= 1)) return setError("The bill total needs to be more than zero.");
		if (!name.trim()) return setError("Add your name so friends know who they’re paying.");
		if (!isValidUpiId(upiId)) return setError("That UPI ID doesn’t look right (e.g. priya@okaxis).");
		setError("");
		setCreating(true);
		const req: PayRequest = {
			kind: "dinner",
			title: draft.title.trim().slice(0, 60) || "Our bill",
			name: name.trim().slice(0, 40),
			upiId: upiId.trim(),
			target,
			people: 0,
			paid: [],
			items,
		};
		try {
			const path = await createCloudSplit(req);
			track("bill_link_created", { items: items.length, scanned });
			rememberOrganiser(path.split("#")[0]);
			window.location.assign(path);
		} catch {
			setCreating(false);
			setError("Couldn’t create the link. Check your connection and try again.");
		}
	};

	return (
		<div className="mx-auto w-full max-w-3xl min-w-0 px-4 py-8 sm:py-12">
			<p className="text-sm font-semibold text-brand-700">New · for restaurant and food-order bills</p>
			<h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink [text-wrap:balance] sm:text-5xl">
				Scan the bill. Friends tap what they ate.
			</h1>
			<p className="mt-3 max-w-2xl text-ink-soft sm:text-lg">
				Share one link. Everyone ticks their own dishes, sees their exact share with tax and delivery worked in, and pays you
				by UPI. You watch it fill up live. No signup for anyone.
			</p>

			<form onSubmit={create} className="mt-8 space-y-4">
				<Step n={1} title="Scan the bill or a food-order screenshot">
					<ScanOrderButton state={state} onFile={read} label="Scan the bill" />
					<p className="mt-1 hidden text-xs text-ink-muted sm:block">On a computer you can also paste a screenshot here.</p>
				</Step>

				<Step n={2} title="Check the items">
					<label className="mb-4 block">
						<span className="text-[13px] font-semibold text-ink-soft">What’s it for?</span>
						<input className={`${field} mt-1`} value={draft.title} maxLength={60} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Dinner at Toit" />
					</label>
					<OrderSplit draft={draft} onChange={setDraft} people={[]} currency={INR} hideShares />
				</Step>

				<Step n={3} title="Where friends pay you">
					<div className="grid gap-3 sm:grid-cols-2">
						<label className="block">
							<span className="text-[13px] font-semibold text-ink-soft">Your name</span>
							<input className={`${field} mt-1`} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Priya" autoComplete="given-name" />
						</label>
						<label className="block">
							<span className="text-[13px] font-semibold text-ink-soft">Your UPI ID</span>
							<input
								className={`${field} mt-1`}
								value={upiId}
								maxLength={80}
								onChange={(e) => setUpiId(e.target.value)}
								placeholder="priya@okaxis"
								autoCapitalize="none"
								autoCorrect="off"
								spellCheck={false}
								inputMode="email"
							/>
						</label>
					</div>
				</Step>

				<div className="space-y-2">
					<button type="submit" disabled={creating} className="btn-primary w-full !justify-center !py-3.5 !text-base disabled:opacity-60">
						{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
						{creating ? "Encrypting and creating your link…" : `Create the link for ₹${target.toLocaleString("en-IN")}`}
						{!creating && <ArrowRight className="h-4 w-4" />}
					</button>
					{error ? (
						<p role="alert" className="text-sm font-semibold text-negative">{error}</p>
					) : (
						<p className="text-xs text-ink-muted">
							🔒 End-to-end encrypted: only people with your link can read it. Deleted automatically after {SPLIT_TTL_DAYS} days.
							Payments go straight to your UPI ID.
						</p>
					)}
				</div>
			</form>
		</div>
	);
};
