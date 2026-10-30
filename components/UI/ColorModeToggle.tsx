"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { COLOR_MODES, getColorMode, setColorMode, type ColorMode } from "@/utils/colorMode";

const LABEL: Record<ColorMode, string> = { system: "System", light: "Light", dark: "Dark" };
const ICON = { system: Monitor, light: Sun, dark: Moon };

/** One button that steps through System → Light → Dark; the label says which is on. */
export const ColorModeToggle = () => {
	// "system" on the server and first render, so hydration matches; the real choice is already painted by the head script.
	const [mode, setMode] = useState<ColorMode>("system");
	useEffect(() => setMode(getColorMode()), []);

	const next = COLOR_MODES[(COLOR_MODES.indexOf(mode) + 1) % COLOR_MODES.length];
	const Icon = ICON[mode];
	return (
		<button
			type="button"
			className="btn-ghost"
			aria-label={`Theme: ${LABEL[mode]}. Switch to ${LABEL[next]}`}
			onClick={() => {
				setColorMode(next);
				setMode(next);
			}}
		>
			<Icon className="h-4 w-4" aria-hidden />
			<span className="hidden sm:inline">Theme</span>
		</button>
	);
};
