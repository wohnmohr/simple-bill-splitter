"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/utils/formatting";
import { CURRENCIES } from "@/constants";
import {
	CalculatorResult,
	fieldClass,
	labelClass,
	makePeople,
} from "./shared";

const INR = CURRENCIES.find((c) => c.code === "INR")!;
const inr = (n: number) => formatCurrency(Math.round(n * 100) / 100, INR);
const n = (v: string) => Math.max(0, parseFloat(v) || 0);

const Field = ({
	id,
	label,
	value,
	onChange,
	hint,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (v: string) => void;
	hint?: string;
}) => (
	<div>
		<label className={labelClass} htmlFor={id}>
			{label}
		</label>
		<input
			id={id}
			className={fieldClass}
			inputMode="decimal"
			value={value}
			onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
		/>
		{hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
	</div>
);

/** Fuel + tolls + parking for a road trip or a daily carpool, split per person. */
export const RoadTripCalculator = () => {
	const [mode, setMode] = useState<"trip" | "carpool">("trip");
	const [distance, setDistance] = useState("320");
	const [roundTrip, setRoundTrip] = useState(true);
	const [mileage, setMileage] = useState("15");
	const [price, setPrice] = useState("100");
	const [tolls, setTolls] = useState("450");
	const [other, setOther] = useState("0");
	const [wear, setWear] = useState("0");
	const [names, setNames] = useState("You, Friend A, Friend B");
	const [driverPays, setDriverPays] = useState(true);
	const [days, setDays] = useState("22");

	const people = useMemo(() => makePeople(names.split(",")), [names]);
	const driver = people[0];
	const sharers = driverPays ? people : people.slice(1);

	const km = n(distance) * (roundTrip ? 2 : 1);
	const litres = n(mileage) > 0 ? km / n(mileage) : 0;
	const fuel = litres * n(price);
	const wearCost = km * n(wear);
	const total = fuel + wearCost + n(tolls) + n(other);
	const perPerson = sharers.length > 0 ? total / sharers.length : 0;

	const expenses =
		total > 0 && driver && sharers.length > 0
			? [
					{
						id: "exp-1",
						amount: Math.round(total * 100) / 100,
						paidBy: driver.id,
						participants: sharers.map((p) => p.id),
						description: mode === "trip" ? "Road trip" : "Carpool",
						splitMethod: "equally" as const,
					},
				]
			: [];

	const rows: [string, string][] = [
		[`Fuel (${litres.toFixed(1)} units × ${inr(n(price))})`, inr(fuel)],
		...(wearCost > 0 ? ([["Wear & tear", inr(wearCost)]] as [string, string][]) : []),
		["Tolls", inr(n(tolls))],
		["Parking & other", inr(n(other))],
		["Total", inr(total)],
	];

	const extra = (
		<div className="space-y-3">
			<dl className="divide-y divide-line rounded-xl border border-line text-sm">
				{rows.map(([k, v]) => (
					<div key={k} className="flex items-center justify-between gap-3 px-3 py-2">
						<dt className="min-w-0 text-ink-muted">{k}</dt>
						<dd className="shrink-0 font-semibold tabular-nums text-ink">{v}</dd>
					</div>
				))}
			</dl>
			<p className="rounded-xl bg-paper px-3 py-2.5 text-sm text-ink-soft">
				<span className="font-semibold text-ink">{inr(perPerson)}</span> per person
				{mode === "carpool" && n(days) > 0 && (
					<>
						{" "}
						· about{" "}
						<span className="font-semibold text-ink">{inr(perPerson * n(days))}</span> a month
						over {n(days)} days
					</>
				)}
				.
			</p>
		</div>
	);

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<div className="surface space-y-4 p-4 sm:p-5">
				<div className="grid grid-cols-2 gap-2">
					{(
						[
							["trip", "Road trip"],
							["carpool", "Daily carpool"],
						] as const
					).map(([id, label]) => (
						<button
							key={id}
							type="button"
							aria-pressed={mode === id}
							onClick={() => {
								setMode(id);
								setRoundTrip(true);
								setDistance(id === "trip" ? "320" : "18");
								setTolls(id === "trip" ? "450" : "0");
							}}
							className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
								mode === id
									? "border-brand-700 bg-brand-700 text-white"
									: "border-line-strong bg-white text-ink-soft hover:border-ink-muted"
							}`}
						>
							{label}
						</button>
					))}
				</div>

				<div className="grid grid-cols-2 gap-3">
					<Field id="rt-distance" label="Distance (km)" value={distance} onChange={setDistance} />
					<Field id="rt-mileage" label="Mileage (km per litre/kg)" value={mileage} onChange={setMileage} />
				</div>
				<label className="flex items-center gap-2.5 text-sm text-ink-soft">
					<input
						type="checkbox"
						checked={roundTrip}
						onChange={(e) => setRoundTrip(e.target.checked)}
						className="h-4 w-4 rounded border-line-strong accent-brand-700"
					/>
					Round trip (count the distance twice)
				</label>
				<Field
					id="rt-price"
					label="Fuel price (₹ per litre or kg)"
					value={price}
					onChange={setPrice}
					hint="Prices differ by city and fuel — use today’s rate near you. For CNG, use ₹ per kg."
				/>
				<div className="grid grid-cols-2 gap-3">
					<Field id="rt-tolls" label="Tolls (₹)" value={tolls} onChange={setTolls} />
					<Field id="rt-other" label="Parking & other (₹)" value={other} onChange={setOther} />
				</div>
				<Field
					id="rt-wear"
					label="Wear & tear (₹ per km, optional)"
					value={wear}
					onChange={setWear}
					hint="Tyres, servicing, depreciation. Leave 0 to split fuel and tolls only."
				/>
				{mode === "carpool" && (
					<Field id="rt-days" label="Days per month" value={days} onChange={setDays} />
				)}

				<div>
					<label className={labelClass} htmlFor="rt-names">
						People (comma-separated, driver first)
					</label>
					<input
						id="rt-names"
						className={fieldClass}
						value={names}
						onChange={(e) => setNames(e.target.value)}
					/>
				</div>
				<label className="flex items-center gap-2.5 text-sm text-ink-soft">
					<input
						type="checkbox"
						checked={driverPays}
						onChange={(e) => setDriverPays(e.target.checked)}
						className="h-4 w-4 rounded border-line-strong accent-brand-700"
					/>
					Driver also pays a share
				</label>
			</div>

			<CalculatorResult
				title={mode === "trip" ? "Road trip split" : "Carpool split"}
				people={people}
				expenses={expenses}
				currency={INR}
				extra={extra}
				tool="road-trip-cost-splitter"
				ctaLabel="Track the whole trip in SplitBiller"
			/>
		</div>
	);
};
