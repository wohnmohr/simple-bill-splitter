"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Shuffle } from "lucide-react";
import { fieldClass, labelClass, parseNames, shuffled, useCopy, useEngaged, useTrackResult } from "./shared";

const TOOL = "random-team-generator";

/** Deals shuffled names round-robin into `count` teams so sizes differ by at most one. */
export function dealTeams(names: string[], count: number): string[][] {
	const teams: string[][] = Array.from({ length: count }, () => []);
	shuffled(names).forEach((name, i) => teams[i % count].push(name));
	return teams;
}

export const TeamGenerator = () => {
	const [text, setText] = useState("Asha\nRohan\nMeera\nKabir\nIsha\nDev\nNeha\nVikram");
	const [by, setBy] = useState<"teams" | "size">("teams");
	const [amount, setAmount] = useState("2");
	const [teams, setTeams] = useState<string[][] | null>(null);
	const [copied, copy] = useCopy();
	const engaged = useEngaged(TOOL);
	useTrackResult(TOOL, !!teams);

	const names = useMemo(() => parseNames(text), [text]);
	const value = Math.max(1, parseInt(amount, 10) || 1);
	const teamCount = Math.min(names.length, by === "teams" ? value : Math.ceil(names.length / value));
	const valid = names.length >= 2 && teamCount >= 2;

	const generate = () => {
		engaged();
		if (valid) setTeams(dealTeams(names, teamCount));
	};

	const summary = teams?.map((t, i) => `Team ${i + 1}: ${t.join(", ")}`).join("\n") ?? "";

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
			<div className="surface space-y-4 p-4 sm:p-5">
				<div>
					<label className={labelClass} htmlFor="team-names">
						Players <span className="font-normal text-ink-muted">(one per line)</span>
					</label>
					<textarea
						id="team-names"
						className={fieldClass}
						rows={8}
						value={text}
						onChange={(e) => {
							engaged();
							setText(e.target.value);
						}}
					/>
				</div>
				<div className="flex gap-2">
					<select className={fieldClass} value={by} onChange={(e) => setBy(e.target.value as "teams" | "size")} aria-label="Split by">
						<option value="teams">Number of teams</option>
						<option value="size">People per team</option>
					</select>
					<input
						className={`${fieldClass} !w-24 shrink-0`}
						inputMode="numeric"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						aria-label="Amount"
					/>
				</div>
				<button type="button" onClick={generate} disabled={!valid} className="btn-primary w-full">
					<Shuffle className="h-4 w-4" />
					{teams ? "Shuffle again" : "Generate teams"}
				</button>
				{!valid && <p className="text-sm text-gray-500">Add at least 2 players and ask for at least 2 teams.</p>}
			</div>

			<div className="space-y-3">
				{teams ? (
					<>
						<div className="grid gap-3 sm:grid-cols-2">
							{teams.map((team, i) => (
								<div key={i} className="surface p-4">
									<p className="label-text">
										Team {i + 1} · {team.length}
									</p>
									<ul className="mt-1 space-y-0.5 text-sm font-medium text-gray-800">
										{team.map((name) => (
											<li key={name}>{name}</li>
										))}
									</ul>
								</div>
							))}
						</div>
						<button type="button" onClick={() => copy(summary)} className="btn-secondary w-full">
							{copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
							{copied ? "Copied" : "Copy teams"}
						</button>
					</>
				) : (
					<div className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-6 text-center text-sm text-gray-500">
						Your teams will appear here.
					</div>
				)}
			</div>
		</div>
	);
};
