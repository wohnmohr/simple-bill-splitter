"use client";

import { MantineProvider as MantineProviderBase } from "@mantine/core";
import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Mantine reads the same theme tokens as Tailwind (see app/globals.css), so
// modals, menus and inputs follow a group's theme too.
const brand = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"].map((n) => `rgb(var(--sb-brand-${n}))`);

const inputStyles = {
	input: {
		borderColor: "rgb(var(--sb-line-strong))",
		backgroundColor: "rgb(var(--sb-surface))",
		color: "rgb(var(--sb-ink))",
		minHeight: 48,
		fontSize: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: 600,
		color: "rgb(var(--sb-ink))",
		marginBottom: 6,
	},
};

const theme = createTheme({
	primaryColor: "brand",
	primaryShade: 7,
	colors: {
		brand: brand as unknown as MantineColorsTuple,
		// Legacy callers pass color="indigo"; keep them on-brand.
		indigo: brand as unknown as MantineColorsTuple,
		purple: brand as unknown as MantineColorsTuple,
	},
	black: "#282326",
	// Controls 12px, dialogs 24px (design system v1).
	defaultRadius: "md",
	radius: { md: "12px", xl: "24px" },
	cursorType: "pointer",
	focusRing: "auto",
	fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	headings: {
		fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
		fontWeight: "700",
	},
	components: {
		TextInput: { styles: inputStyles },
		NumberInput: { styles: inputStyles },
		Select: { styles: inputStyles },
		Modal: {
			defaultProps: {
				overlayProps: { backgroundOpacity: 0.5, color: "#171317" },
				radius: "xl",
			},
		},
	},
});

export function MantineProvider({ children }: { children: React.ReactNode }) {
	return (
		<MantineProviderBase theme={theme} defaultColorScheme="light">
			{children}
		</MantineProviderBase>
	);
}
