"use client";

import { useEffect } from "react";
import { captureInstallPrompt } from "@/lib/installPrompt";

/** Listens for the browser's install prompt on every page, so the dashboard can offer it later. */
export const InstallPromptCapture = () => {
	useEffect(captureInstallPrompt, []);
	return null;
};
