"use client";

import { CalculatorKind } from "@/content/tools";
import { RestaurantCalculator } from "@/components/Tools/calculators/RestaurantCalculator";
import { TipTaxCalculator } from "@/components/Tools/calculators/TipTaxCalculator";
import { UnequalCalculator } from "@/components/Tools/calculators/UnequalCalculator";
import { MultiExpenseCalculator } from "@/components/Tools/calculators/MultiExpenseCalculator";
import { SimpleSplitCalculator } from "@/components/Tools/calculators/SimpleSplitCalculator";
import { UpiCalculator } from "@/components/Tools/calculators/UpiCalculator";
import { UpiFeeCalculator } from "@/components/Tools/calculators/UpiFeeCalculator";

export const ToolCalculator = ({ kind }: { kind: CalculatorKind }) => {
	switch (kind) {
		case "restaurant":
			return <RestaurantCalculator />;
		case "tip":
			return <TipTaxCalculator mode="tip" />;
		case "tax":
			return <TipTaxCalculator mode="tax" />;
		case "unequal":
			return <UnequalCalculator />;
		case "trip":
			return <MultiExpenseCalculator variant="trip" />;
		case "roommate":
			return <MultiExpenseCalculator variant="roommate" />;
		case "simple":
			return <SimpleSplitCalculator emphasis="privacy" />;
		case "splitwise":
			return <SimpleSplitCalculator emphasis="alternative" />;
		case "upi":
			return <UpiCalculator />;
		case "upi-fee-customer":
			return <UpiFeeCalculator audience="customer" />;
		case "upi-fee-merchant":
			return <UpiFeeCalculator audience="merchant" />;
		default:
			return <RestaurantCalculator />;
	}
};
