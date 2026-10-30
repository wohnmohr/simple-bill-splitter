import type { Currency } from "@/types";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/constants";

// Euro-area regions, for a locale like "de-DE" or "fr-BE".
const EURO = new Set(["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"]);
const byCode = (code: string) => CURRENCIES.find((c) => c.code === code)!;

/**
 * The currency a new group starts in, from where this visitor is. The time zone
 * decides India first: many phones there run an en-US locale. Elsewhere the
 * locale's region picks one we support, and anywhere else gets dollars.
 * Pure for tests: pass the zone and locale; in the browser they come from Intl.
 */
export function localCurrency(zone?: string, locale = ""): Currency {
	if (zone === undefined) {
		// On the server there's no visitor yet; the client picks after it mounts.
		if (typeof window === "undefined") return DEFAULT_CURRENCY;
		zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
		locale = navigator.language ?? "";
	}
	if (zone === "Asia/Kolkata" || zone === "Asia/Calcutta") return byCode("INR");
	const region = (locale.split("-")[1] ?? "").toUpperCase();
	if (region === "IN") return byCode("INR");
	if (region === "GB") return byCode("GBP");
	if (region === "JP" || zone === "Asia/Tokyo") return byCode("JPY");
	if (EURO.has(region)) return byCode("EUR");
	if (zone.startsWith("Europe/") && !region) return byCode("EUR");
	return byCode("USD");
}
