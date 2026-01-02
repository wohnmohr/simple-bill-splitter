"use client";

import { MantineProvider as MantineProviderBase } from "@mantine/core";
import { createTheme } from "@mantine/core";

const theme = createTheme({
	primaryColor: "indigo",
	colors: {
		indigo: [
			"#eef2ff",
			"#e0e7ff",
			"#c7d2fe",
			"#a5b4fc",
			"#818cf8",
			"#6366f1",
			"#4f46e5",
			"#4338ca",
			"#3730a3",
			"#312e81",
		],
		purple: [
			"#faf5ff",
			"#f3e8ff",
			"#e9d5ff",
			"#d8b4fe",
			"#c084fc",
			"#a855f7",
			"#9333ea",
			"#7e22ce",
			"#6b21a8",
			"#581c87",
		],
	},
	defaultRadius: "md",
	fontFamily:
		"var(--font-poppins), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
});

export function MantineProvider({ children }: { children: React.ReactNode }) {
	return (
		<MantineProviderBase theme={theme} defaultColorScheme="light">
			{children}
		</MantineProviderBase>
	);
}
