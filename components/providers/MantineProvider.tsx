"use client";

import { MantineProvider as MantineProviderBase } from "@mantine/core";
import { createTheme } from "@mantine/core";

const brand = [
	"#f6f2fa",
	"#ece3f5",
	"#d8c6ea",
	"#bd9fdb",
	"#9d73c7",
	"#7e4fb0",
	"#663a96",
	"#53307b",
	"#432763",
	"#2f1b46",
] as const;

const inputStyles = {
	input: {
		borderColor: "#d4cfd9",
		backgroundColor: "#ffffff",
		minHeight: 44,
		fontSize: 16,
	},
	label: {
		fontSize: 13,
		fontWeight: 600,
		color: "#4a4556",
		marginBottom: 6,
	},
};

const theme = createTheme({
	primaryColor: "brand",
	primaryShade: 7,
	colors: {
		brand: [...brand],
		// Legacy callers pass color="indigo"; keep them on-brand.
		indigo: [...brand],
		purple: [...brand],
	},
	black: "#1c1826",
	defaultRadius: "md",
	cursorType: "pointer",
	focusRing: "auto",
	fontFamily: "var(--font-outfit), ui-sans-serif, system-ui, sans-serif",
	headings: {
		fontFamily:
			"var(--font-fraunces), var(--font-outfit), ui-serif, Georgia, serif",
		fontWeight: "600",
	},
	components: {
		TextInput: { styles: inputStyles },
		NumberInput: { styles: inputStyles },
		Select: { styles: inputStyles },
		Modal: {
			defaultProps: {
				overlayProps: { backgroundOpacity: 0.4, color: "#1c1826" },
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
