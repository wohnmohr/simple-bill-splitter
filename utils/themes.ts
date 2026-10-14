/**
 * Group themes, like chat themes in messaging apps: a group picks one and
 * everyone who opens it sees it (for synced groups it travels in the
 * encrypted group state). Each theme is a full set of color tokens, checked
 * for WCAG AA contrast on every text/background pair the app uses.
 *
 * Tokens are the CSS variables Tailwind and Mantine read (tailwind.config.ts,
 * app/globals.css). Applying a theme sets them on <html>, so portals such as
 * modals and menus follow it too.
 */

export const THEME_TOKENS = [
	"brand-50", "brand-100", "brand-200", "brand-300", "brand-400", "brand-500",
	"brand-600", "brand-700", "brand-800", "brand-900", "brand-950",
	"ink", "ink-soft", "ink-muted", "paper", "surface", "line", "line-strong",
	"positive", "positive-soft", "negative", "negative-soft", "on-brand", "on-ink",
] as const;
export type ThemeToken = (typeof THEME_TOKENS)[number];

export type Theme = {
	id: string;
	name: string;
	tagline: string;
	dark: boolean;
	colors: Record<ThemeToken, string>;
};

type Scale = [string, string, string, string, string, string, string, string, string, string, string];
const scale = (s: Scale) =>
	Object.fromEntries(s.map((hex, i) => [`brand-${[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950][i]}`, hex])) as Record<`brand-${number}`, string>;

/** Shared by the light themes: white cards, the house green and red, white text on accents. */
const LIGHT = {
	surface: "#ffffff",
	positive: "#11754c",
	"positive-soft": "#e8f4ee",
	negative: "#b42318",
	"negative-soft": "#fcecea",
	"on-brand": "#ffffff",
	"on-ink": "#ffffff",
};

const light = (id: string, name: string, tagline: string, brand: Scale, rest: Record<"ink" | "ink-soft" | "ink-muted" | "paper" | "line" | "line-strong", string>): Theme => ({
	id,
	name,
	tagline,
	dark: false,
	colors: { ...LIGHT, ...scale(brand), ...rest } as Theme["colors"],
});

/**
 * Dark themes run the accent scale backwards: low numbers are deep tints for
 * chips and highlights, 700 is a light accent for buttons and links, and text
 * on it is dark.
 */
const dark = (id: string, name: string, tagline: string, brand: Scale, rest: Omit<Record<ThemeToken, string>, `brand-${number}`>): Theme => ({
	id,
	name,
	tagline,
	dark: true,
	colors: { ...scale(brand), ...rest } as Theme["colors"],
});

export const DEFAULT_THEME_ID = "aubergine";

export const THEMES: Theme[] = [
	light("aubergine", "Aubergine", "SplitBiller classic",
		["#f6f2fa", "#ece3f5", "#d8c6ea", "#bd9fdb", "#9d73c7", "#7e4fb0", "#663a96", "#53307b", "#432763", "#2f1b46", "#1f1230"],
		{ ink: "#1c1826", "ink-soft": "#4a4556", "ink-muted": "#6b6576", paper: "#f7f6f3", line: "#e7e3ea", "line-strong": "#d4cfd9" }),
	light("ocean", "Ocean", "Calm corporate blue",
		["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"],
		{ ink: "#111827", "ink-soft": "#374151", "ink-muted": "#5b6472", paper: "#f5f7fa", line: "#e3e8ef", "line-strong": "#cfd6e0" }),
	light("evergreen", "Evergreen", "Fresh forest green",
		["#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"],
		{ ink: "#111a14", "ink-soft": "#3b4a40", "ink-muted": "#56665c", paper: "#f5f7f4", line: "#e2e8e3", "line-strong": "#ccd6ce" }),
	light("slate", "Slate", "Quiet neutral grey",
		["#eef2f6", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#3b4a5e", "#334155", "#1e293b", "#0f172a", "#020617"],
		{ ink: "#0f172a", "ink-soft": "#334155", "ink-muted": "#56637a", paper: "#f6f7f9", line: "#e2e8f0", "line-strong": "#cbd5e1" }),
	light("terracotta", "Terracotta", "Warm clay",
		["#fdf5f1", "#fbe8de", "#f6cdb9", "#efa98a", "#e47d55", "#d65e33", "#bf4a22", "#9f3a1b", "#82311a", "#6b2a19", "#3a130a"],
		{ ink: "#1f1712", "ink-soft": "#4a3d35", "ink-muted": "#6b5c52", paper: "#faf7f4", line: "#ece4dd", "line-strong": "#d9cec5" }),
	light("lagoon", "Lagoon", "Cool teal",
		["#f0fdfa", "#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59", "#134e4a", "#042f2e"],
		{ ink: "#10201d", "ink-soft": "#35504b", "ink-muted": "#52696a", paper: "#f4f8f7", line: "#e0ebe8", "line-strong": "#c8d9d5" }),
	light("saffron", "Saffron", "Warm marigold",
		["#fffbeb", "#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#a14907", "#92400e", "#78350f", "#451a03"],
		{ ink: "#1c1a14", "ink-soft": "#4a4436", "ink-muted": "#675f4e", paper: "#faf8f3", line: "#ebe5d6", "line-strong": "#d9d0bc" }),
	dark("midnight", "Midnight", "Dark, indigo accents",
		["#1b1d3a", "#23264d", "#2e3266", "#3b4185", "#5158b8", "#6b73d6", "#8b93ea", "#a5b4fc", "#c7d2fe", "#e0e7ff", "#eef2ff"],
		{
			ink: "#e7e9f3", "ink-soft": "#c3c7d9", "ink-muted": "#9aa0b8", paper: "#0b1020", surface: "#141a2e",
			line: "#232a42", "line-strong": "#323a55", positive: "#4ade80", "positive-soft": "#10291c",
			negative: "#f87171", "negative-soft": "#2f1518", "on-brand": "#0b1020", "on-ink": "#0b1020",
		}),
	dark("graphite", "Graphite", "Dark, amber accents",
		["#2a2112", "#3a2d14", "#4d3a15", "#6b4f17", "#92681a", "#b8841c", "#d9a22b", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"],
		{
			ink: "#f4f4f5", "ink-soft": "#d4d4d8", "ink-muted": "#a1a1aa", paper: "#111113", surface: "#1b1b1f",
			line: "#2a2a30", "line-strong": "#3a3a42", positive: "#4ade80", "positive-soft": "#0f2a1a",
			negative: "#f87171", "negative-soft": "#2d1515", "on-brand": "#18120a", "on-ink": "#111113",
		}),
];

export const getTheme = (id: unknown): Theme | undefined => THEMES.find((t) => t.id === id);
export const isThemeId = (id: unknown): id is string => typeof id === "string" && !!getTheme(id);

const channels = (hex: string) => {
	const n = parseInt(hex.slice(1), 16);
	return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/** Mantine's own greys (menu hovers, close buttons) need dark values in dark themes. */
const MANTINE_DARK_GREYS = ["--mantine-color-gray-0", "--mantine-color-gray-1", "--mantine-color-gray-2"];

/**
 * Paints the page with a theme by setting the tokens on <html>. Pass nothing
 * (or the default) to go back to SplitBiller's own colors.
 */
export function applyTheme(id?: string) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	const theme = id && id !== DEFAULT_THEME_ID ? getTheme(id) : undefined;
	for (const token of THEME_TOKENS) {
		if (theme) root.style.setProperty(`--sb-${token}`, channels(theme.colors[token]));
		else root.style.removeProperty(`--sb-${token}`);
	}
	const greys = theme?.dark ? [theme.colors.paper, theme.colors.line, theme.colors["line-strong"]] : null;
	MANTINE_DARK_GREYS.forEach((v, i) => (greys ? root.style.setProperty(v, greys[i]) : root.style.removeProperty(v)));
	root.style.colorScheme = theme?.dark ? "dark" : "";
	root.toggleAttribute("data-sb-dark", !!theme?.dark);
	root.dataset.sbTheme = theme?.id ?? DEFAULT_THEME_ID;
}
