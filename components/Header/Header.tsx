import { Currency } from "@/types";
import { CURRENCIES } from "@/constants";

interface HeaderProps {
	currency: Currency;
	onCurrencyChange: (currency: Currency) => void;
	disabled?: boolean;
}

export const Header = ({
	currency,
	onCurrencyChange,
	disabled = false,
}: HeaderProps) => {
	return (
		<div className="mb-3 sm:mb-4">
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
				<h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
					Bill Splitter
				</h1>
				<select
					value={currency.code}
					onChange={(e) => {
						const selected = CURRENCIES.find((c) => c.code === e.target.value);
						if (selected) onCurrencyChange(selected);
					}}
					disabled={disabled}
					className={`px-3 py-2 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm font-medium shadow-sm w-full sm:w-auto touch-manipulation ${
						disabled ? "opacity-50 cursor-not-allowed" : ""
					}`}
				>
					{CURRENCIES.map((curr) => (
						<option key={curr.code} value={curr.code}>
							{curr.symbol} {curr.code}
						</option>
					))}
				</select>
			</div>
		</div>
	);
};
