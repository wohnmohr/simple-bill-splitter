"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	AlertCircle,
	ArrowRight,
	Check,
	Loader2,
	Lock,
	Receipt,
} from "lucide-react";
import { ShareSnapshot } from "@/types/share";
import { decodeShareUrl } from "@/utils/shareCodec";
import { importShareSnapshot } from "@/utils/shareImport";
import { calculateBalances, calculateSettlements } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatting";
import { BalanceList } from "@/components/Balances/BalanceList";
import { SettlementList } from "@/components/Settlements/SettlementList";
import { Button } from "@/components/UI/Button";
import { track, trackError } from "@/lib/analytics";

type LoadState =
	| { status: "loading" }
	| { status: "empty" }
	| { status: "error"; message: string }
	| { status: "ready"; snapshot: ShareSnapshot };

export const ShareViewer = () => {
	const router = useRouter();
	const [state, setState] = useState<LoadState>({ status: "loading" });
	const [importError, setImportError] = useState<string | null>(null);
	const [importing, setImporting] = useState(false);

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			const hash = window.location.hash;
			if (!hash || hash.length < 8) {
				if (!cancelled) setState({ status: "empty" });
				return;
			}

			try {
				const snapshot = await decodeShareUrl(hash);
				if (!cancelled) {
					setState({ status: "ready", snapshot });
					track("share_link_opened", {
						member_count: snapshot.members.length,
						expense_count: snapshot.expenses.length,
						currency: snapshot.currency.code,
					});
				}
			} catch (err) {
				if (!cancelled) {
					track("share_link_decode_failed");
					trackError(err, { source: "share_decode" });
					setState({
						status: "error",
						message:
							"This share link is invalid or corrupted. Ask the sender to share again.",
					});
				}
			}
		};

		load();

		const onHashChange = () => load();
		window.addEventListener("hashchange", onHashChange);
		return () => {
			cancelled = true;
			window.removeEventListener("hashchange", onHashChange);
		};
	}, []);

	const handleOpenInApp = () => {
		if (state.status !== "ready") return;
		setImporting(true);
		setImportError(null);
		const result = importShareSnapshot(state.snapshot);
		if (!result.ok) {
			setImporting(false);
			track("share_import_failed", { reason: result.reason });
			setImportError(
				result.reason === "limit"
					? "You already have 3 groups saved. Delete one in the app, then try again."
					: "Nothing to import."
			);
			return;
		}
		track("share_imported_to_app", {
			member_count: state.snapshot.members.length,
			expense_count: state.snapshot.expenses.length,
		});
		router.push("/dashboard");
	};

	if (state.status === "loading") {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
				<p className="text-sm">Decrypting settlement in your browser…</p>
			</div>
		);
	}

	if (state.status === "empty") {
		return (
			<div className="max-w-md mx-auto text-center py-16 space-y-4">
				<Receipt className="h-12 w-12 mx-auto text-indigo-500" />
				<h1 className="text-2xl font-bold text-gray-900">No settlement here</h1>
				<p className="text-gray-600 text-sm">
					Open a share link from a friend, or start a new split yourself.
				</p>
				<Link href="/dashboard">
					<Button variant="primary" size="lg">
						Start splitting
					</Button>
				</Link>
			</div>
		);
	}

	if (state.status === "error") {
		return (
			<div className="max-w-md mx-auto text-center py-16 space-y-4">
				<AlertCircle className="h-12 w-12 mx-auto text-red-500" />
				<h1 className="text-2xl font-bold text-gray-900">Can&apos;t open this link</h1>
				<p className="text-gray-600 text-sm">{state.message}</p>
				<Link href="/dashboard">
					<Button variant="primary" size="lg">
						Open SplitBiller
					</Button>
				</Link>
			</div>
		);
	}

	const { snapshot } = state;
	const balances = calculateBalances(snapshot.members, snapshot.expenses);
	const settlements = calculateSettlements(snapshot.members, snapshot.expenses);
	const total = snapshot.expenses.reduce((sum, e) => sum + e.amount, 0);

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<div className="text-center space-y-2">
				<div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
					<Lock className="h-3.5 w-3.5" />
					Decrypted on this device only
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
					{snapshot.name}
				</h1>
				<p className="text-sm text-gray-600">
					{snapshot.members.length} people · {snapshot.expenses.length} expense
					{snapshot.expenses.length === 1 ? "" : "s"} ·{" "}
					{formatCurrency(total, snapshot.currency)} total
				</p>
			</div>

			<div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-4 sm:p-5 space-y-3">
				<button
					type="button"
					onClick={handleOpenInApp}
					disabled={importing}
					className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg touch-manipulation disabled:opacity-60"
				>
					{importing ? (
						<>
							<Loader2 className="h-5 w-5 animate-spin" />
							Opening…
						</>
					) : (
						<>
							Open in SplitBiller
							<ArrowRight className="h-5 w-5" />
						</>
					)}
				</button>
				{importError && (
					<p className="text-xs text-red-600 text-center">{importError}</p>
				)}
				<p className="text-xs text-gray-500 text-center">
					Saves a copy on this device so you can edit or add expenses. Nothing is
					uploaded.
				</p>
			</div>

			<section className="space-y-2">
				<h2 className="text-sm font-bold text-gray-800 px-1">Who pays whom</h2>
				{settlements.length === 0 ? (
					<div className="bg-white/80 rounded-xl border border-white/50 p-6 text-center">
						<Check className="h-10 w-10 mx-auto mb-2 text-green-500" />
						<p className="font-semibold text-gray-700">All settled up</p>
					</div>
				) : (
					<SettlementList
						settlements={settlements}
						people={snapshot.members}
						currency={snapshot.currency}
						groupName={snapshot.name}
						expenses={snapshot.expenses}
						readOnly
					/>
				)}
			</section>

			<section className="space-y-2">
				<h2 className="text-sm font-bold text-gray-800 px-1">Balances</h2>
				<BalanceList
					balances={balances}
					people={snapshot.members}
					currency={snapshot.currency}
				/>
			</section>

			<section className="space-y-2">
				<h2 className="text-sm font-bold text-gray-800 px-1">Expenses</h2>
				<div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg divide-y divide-gray-100">
					{snapshot.expenses.map((expense) => {
						const payer =
							snapshot.members.find((m) => m.id === expense.paidBy)?.name ||
							"Unknown";
						return (
							<div key={expense.id} className="px-4 py-3 flex justify-between gap-3">
								<div className="min-w-0">
									<p className="font-medium text-gray-900 truncate">
										{expense.description || "Expense"}
									</p>
									<p className="text-xs text-gray-500">Paid by {payer}</p>
								</div>
								<p className="font-semibold text-indigo-700 shrink-0">
									{formatCurrency(expense.amount, snapshot.currency)}
								</p>
							</div>
						);
					})}
				</div>
			</section>

			<div className="text-center pb-8">
				<Link
					href="/"
					className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
				>
					What is SplitBiller?
				</Link>
			</div>
		</div>
	);
};
