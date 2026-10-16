/**
 * Carries a sentence typed on the home page to the dashboard, which opens its
 * preview. Session storage keeps it on this device and out of the URL, so
 * names and amounts never reach logs or analytics.
 */
const KEY = "splitbiller-quick-add";

export function handOffQuickAdd(text: string): void {
	try {
		window.sessionStorage.setItem(KEY, text);
	} catch {
		/* the dashboard opens without a preview */
	}
}

export function takeQuickAdd(): string | null {
	try {
		const text = window.sessionStorage.getItem(KEY);
		window.sessionStorage.removeItem(KEY);
		return text;
	} catch {
		return null;
	}
}
