/**
 * The app-wide light/dark choice. "system" follows the OS through CSS; an
 * explicit choice sets data-theme on <html> (applied before paint by the
 * script in app/layout.tsx, which reads the same key).
 */
export type ColorMode = "system" | "light" | "dark";
export const COLOR_MODES: ColorMode[] = ["system", "light", "dark"];
const KEY = "splitbiller-color-mode";

export function getColorMode(): ColorMode {
	try {
		const m = localStorage.getItem(KEY);
		return m === "light" || m === "dark" ? m : "system";
	} catch {
		return "system";
	}
}

export function setColorMode(mode: ColorMode) {
	try {
		if (mode === "system") localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, mode);
	} catch {
		// Private mode or blocked storage: the choice still applies to this page.
	}
	const root = document.documentElement;
	if (mode === "system") delete root.dataset.theme;
	else root.dataset.theme = mode;
}
