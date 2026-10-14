import { useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";

/** Chromium's install prompt event; not in the DOM typings yet. */
type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
let listening = false;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((fn) => fn());

/**
 * Holds on to the browser's install prompt instead of letting it show at once,
 * so we can offer it after someone has used SplitBiller, not on their first
 * visit. Call once, as early as possible: the event fires once per page load.
 */
export function captureInstallPrompt(): void {
	if (listening || typeof window === "undefined") return;
	listening = true;
	window.addEventListener("beforeinstallprompt", (e) => {
		e.preventDefault();
		deferred = e as BeforeInstallPromptEvent;
		notify();
	});
	window.addEventListener("appinstalled", () => {
		deferred = null;
		track("app_installed");
		notify();
	});
}

const subscribe = (fn: () => void) => {
	subscribers.add(fn);
	return () => subscribers.delete(fn);
};

/** True when the browser will let us install SplitBiller right now (Android and desktop Chromium). */
export const useCanInstall = () => useSyncExternalStore(subscribe, () => deferred !== null, () => false);

/** Shows the browser's install dialog. Resolves true if the person installed. */
export async function promptInstall(): Promise<boolean> {
	const event = deferred;
	if (!event) return false;
	// A prompt can only be shown once.
	deferred = null;
	notify();
	await event.prompt();
	const { outcome } = await event.userChoice;
	return outcome === "accepted";
}
