"use client";

import { useCallback, useEffect, useState } from "react";
import { UpiQr, useCanOpenUpiApps } from "@/components/Settlements/UpiQr";
import { buildUpiLink, isValidUpiId } from "@/utils/upi";
import {
	TEMPLATES,
	getTemplate,
	decodeRequest,
	encodeRequest,
	sharePerPerson,
	totalPaid,
	type PayRequest,
	type SplitTemplate,
} from "@/utils/payStory";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fragment = () => (typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, ""));

/** One route, two states: no fragment → create a request; fragment → show the split. */
export const PayStoryApp = () => {
	const [req, setReq] = useState<PayRequest | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const sync = () => {
			setReq(fragment() ? decodeRequest(fragment()) : null);
			setReady(true);
		};
		sync();
		window.addEventListener("hashchange", sync);
		return () => window.removeEventListener("hashchange", sync);
	}, []);

	const open = useCallback((next: PayRequest) => {
		window.location.hash = encodeRequest(next);
	}, []);

	if (!ready) return null;
	return req ? <StoryView req={req} onChange={open} /> : <CreateForm onCreate={open} />;
};

// ── Create ────────────────────────────────────────────────────

const CreateForm = ({ onCreate }: { onCreate: (r: PayRequest) => void }) => {
	const [kind, setKind] = useState("dinner");
	const [title, setTitle] = useState("");
	const [name, setName] = useState("");
	const [upiId, setUpiId] = useState("");
	const [target, setTarget] = useState("");
	const [people, setPeople] = useState("");
	const [error, setError] = useState("");

	const applyTemplate = (t: SplitTemplate) => {
		setKind(t.id);
		setTitle(t.title);
		setTarget(t.target ? String(t.target) : "");
		setPeople(t.people ? String(t.people) : "");
	};

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		const t = Math.round(Number(target));
		if (!title.trim() || !name.trim()) return setError("Add a title and your name.");
		if (!isValidUpiId(upiId)) return setError("That UPI ID doesn't look right (e.g. priya@okaxis).");
		if (!(t >= 1)) return setError("Enter the amount you need.");
		onCreate({
			kind,
			title: title.trim(),
			name: name.trim(),
			upiId: upiId.trim(),
			target: t,
			people: Math.min(Math.max(Math.floor(Number(people)) || 0, 0), 100),
			paid: [],
		});
	};

	const field = "mt-1 w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-ink outline-none focus:border-brand-500";

	return (
		<form onSubmit={submit} className="space-y-5">
			<div>
				<h1 className="font-display text-3xl font-semibold text-ink">Split it, share it</h1>
				<p className="mt-1 text-ink-muted">
					Pick what you’re splitting, share the link, and friends pay you directly through UPI.
				</p>
			</div>

			<fieldset>
				<legend className="label-text">What are you splitting?</legend>
				<div className="mt-2 grid grid-cols-2 gap-2">
					{TEMPLATES.map((t) => (
						<button
							type="button"
							key={t.id}
							onClick={() => applyTemplate(t)}
							aria-pressed={kind === t.id}
							className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold ${
								kind === t.id ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line-strong bg-white text-ink"
							}`}
						>
							<span className="mr-1.5 text-lg">{t.emoji}</span>
							{t.label}
						</button>
					))}
				</div>
			</fieldset>

			<label className="block">
				<span className="label-text">What’s it for?</span>
				<input className={field} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Dinner tonight" />
			</label>
			<div className="grid grid-cols-2 gap-3">
				<label className="block">
					<span className="label-text">Amount needed (₹)</span>
					<input className={field} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))} placeholder="5000" />
				</label>
				<label className="block">
					<span className="label-text">Split between</span>
					<input className={field} inputMode="numeric" value={people} onChange={(e) => setPeople(e.target.value.replace(/\D/g, ""))} placeholder="Optional" />
				</label>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<label className="block">
					<span className="label-text">Your name</span>
					<input className={field} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
				</label>
				<label className="block">
					<span className="label-text">Your UPI ID</span>
					<input className={field} value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="priya@okaxis" autoCapitalize="none" />
				</label>
			</div>

			{error && <p role="alert" className="text-sm text-negative">{error}</p>}
			<button type="submit" className="btn-primary w-full !py-3">Create split link</button>
			<p className="text-center text-xs text-ink-muted">
				No signup, no server: everything lives inside the link you share.
			</p>
		</form>
	);
};

// ── Story ─────────────────────────────────────────────────────

const StoryView = ({ req, onChange }: { req: PayRequest; onChange: (r: PayRequest) => void }) => {
	const canOpenApps = useCanOpenUpiApps();
	const template = getTemplate(req.kind);
	const share = sharePerPerson(req);
	const paid = totalPaid(req);
	const progress = Math.min(paid / req.target, 1);
	const done = paid >= req.target;

	const [amount, setAmount] = useState(share ? String(share) : "");
	const [who, setWho] = useState("");
	const [paying, setPaying] = useState(false);
	const [copied, setCopied] = useState(false);

	const amt = Math.round(Number(amount));
	const upi = amt >= 1 ? buildUpiLink({ pa: req.upiId, pn: req.name, am: amt, tn: req.title }) : null;

	const record = () => {
		if (!who.trim() || !(amt >= 1)) return;
		onChange({ ...req, paid: [...req.paid, [who.trim().slice(0, 30), amt]] });
		setWho("");
		setPaying(false);
	};

	const link = () => `${window.location.origin}/pay-story#${encodeRequest(req)}`;
	const shareText = done
		? `We did it! ${req.title} is fully paid 🎉`
		: `${req.title} — ${inr(paid)} of ${inr(req.target)} so far. Join in:`;

	const doShare = async () => {
		const url = link();
		if (navigator.share) {
			try {
				await navigator.share({ title: req.title, text: shareText, url });
				return;
			} catch {
				/* cancelled: fall through to copy */
			}
		}
		await navigator.clipboard?.writeText(`${shareText} ${url}`);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="space-y-5">
			<section className="surface overflow-hidden p-5 text-center">
				<p className="label-text">{template.emoji} {template.label} · by {req.name}</p>
				<h1 className="mt-1 font-display text-2xl font-semibold text-ink">{req.title}</h1>
				<div
					role="progressbar"
					aria-valuenow={Math.round(progress * 100)}
					aria-valuemin={0}
					aria-valuemax={100}
					className="my-5 h-3 overflow-hidden rounded-full bg-brand-100"
				>
					<div
						className={`h-full rounded-full transition-all duration-1000 ease-out ${done ? "bg-positive" : "bg-brand-600"}`}
						style={{ width: `${progress * 100}%` }}
					/>
				</div>
				<p className="tabular-nums text-3xl font-semibold text-ink">
					{inr(paid)} <span className="text-lg font-medium text-ink-muted">of {inr(req.target)}</span>
				</p>
				<p className="mt-1 text-sm text-ink-muted" aria-live="polite">
					{done ? "Everyone’s paid 🎉" : `${inr(req.target - paid)} to go`}
				</p>
				{req.paid.length > 0 && (
					<p className="mt-3 text-sm text-ink-soft">
						{req.paid.map(([n, a]) => `${n} ${inr(a)}`).join(" · ")}
					</p>
				)}
			</section>

			{!done && (
				<section className="surface space-y-3 p-5">
					<label className="block">
						<span className="label-text">Your amount (₹)</span>
						<input
							inputMode="numeric"
							value={amount}
							onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
							readOnly={share > 0}
							className="mt-1 w-full rounded-xl border border-line-strong px-3 py-2.5 text-lg outline-none focus:border-brand-500 read-only:bg-paper"
						/>
					</label>

					{canOpenApps === false && upi && (
						<div className="flex items-center gap-4">
							<UpiQr link={upi} label={`UPI QR to pay ${inr(amt)} to ${req.name}`} />
							<p className="text-sm text-ink-soft">Scan with any UPI app to pay {inr(amt)}.</p>
						</div>
					)}
					{canOpenApps !== false && (
						<a
							href={upi ?? undefined}
							onClick={() => upi && setPaying(true)}
							aria-disabled={!upi}
							className={`btn-primary w-full !py-3 ${upi ? "" : "pointer-events-none opacity-50"}`}
						>
							Pay {amt >= 1 ? inr(amt) : ""} with UPI
						</a>
					)}
					<p className="text-xs text-ink-muted">
						Paying <b className="text-ink-soft">{req.upiId}</b>. Check your UPI app shows <b className="text-ink-soft">{req.name}</b> before you confirm. Only pay people you know.
					</p>

					{(paying || canOpenApps === false) && (
						<div className="flex gap-2 border-t border-line pt-3">
							<input
								value={who}
								maxLength={30}
								onChange={(e) => setWho(e.target.value)}
								placeholder="Your first name"
								className="min-w-0 flex-1 rounded-xl border border-line-strong px-3 py-2.5 outline-none focus:border-brand-500"
							/>
							<button onClick={record} disabled={!who.trim() || !(amt >= 1)} className="btn-secondary">
								I’ve paid
							</button>
						</div>
					)}
				</section>
			)}

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				<button onClick={doShare} className="btn-primary !py-3">
					{copied ? "Link copied" : done ? "Share the “we did it” moment" : "Share updated link"}
				</button>
				<a href="/pay-story" className="btn-secondary !py-3">Make your own</a>
			</div>
			<p className="text-center text-xs text-ink-muted">
				Payments are on trust: UPI doesn’t confirm them to us. After someone taps “I’ve paid”, share the updated link so everyone sees who’s paid.
			</p>
		</div>
	);
};
