/**
 * Loads posthog-js on demand, off the critical path.
 *
 * The library is a separate chunk that is fetched only after the page is idle,
 * so it never competes with the first paint or hydration. Anything captured
 * before it is ready is queued with its real timestamp and sent once it loads.
 */
import type { PostHog } from "posthog-js";

type Job = (ph: PostHog) => void;

const MAX_QUEUED = 100;
let client: PostHog | null = null;
let starting = false;
const queue: Job[] = [];

export const analyticsEnabled = () => !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

/** Run `job` with the client now if it's ready, otherwise as soon as it is. */
export function withPostHog(job: Job): void {
	if (typeof window === "undefined" || !analyticsEnabled()) return;
	if (client) {
		try {
			job(client);
		} catch {
			/* analytics must never break the product */
		}
		return;
	}
	if (queue.length < MAX_QUEUED) queue.push(job);
}

/** Capture an event, stamped with the moment it happened rather than when the library arrives. */
export function capture(event: string, properties?: Record<string, unknown>): void {
	const timestamp = new Date();
	withPostHog((ph) => ph.capture(event, properties, { timestamp }));
}

/** Start loading PostHog (once). Safe to call repeatedly. */
export function startPostHog(): void {
	const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	if (!key || client || starting || typeof window === "undefined") return;
	starting = true;

	import("posthog-js")
		.then(({ default: posthog }) => {
			posthog.init(key, {
				api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
				person_profiles: "identified_only",
				capture_pageview: false, // sent on route change by PostHogPageView
				capture_pageleave: true,
				persistence: "localStorage+cookie",
				disable_session_recording: false,
				session_recording: {
					// Privacy-first: never record typed names, amounts, or UPI IDs
					maskAllInputs: true,
					maskTextSelector: "[data-ph-mask], input, textarea",
					recordCrossOriginIframes: false,
				},
				// Browsers mask errors from cross-origin scripts (extensions, in-app
				// browsers, ad blockers) as "Script error." with no stack — nothing
				// to act on, and it floods the exception feed.
				before_send: (event) => {
					if (event?.event !== "$exception") return event;
					const props = event.properties ?? {};
					const message: unknown = props.$exception_list?.[0]?.value ?? props.$exception_message;
					return message === "Script error." ? null : event;
				},
				loaded: (ph) => {
					ph.startExceptionAutocapture?.();
					ph.startSessionRecording?.();
				},
			});
			client = posthog;
			queue.splice(0).forEach((job) => {
				try {
					job(posthog);
				} catch {
					/* ignore */
				}
			});
		})
		.catch(() => {
			starting = false; // blocked by an ad blocker or offline; the product carries on
			queue.length = 0;
		});
}

/** Load PostHog once the browser is idle (and the page has finished loading). */
export function startPostHogWhenIdle(): void {
	const go = () => {
		const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
			.requestIdleCallback;
		if (ric) ric(startPostHog, { timeout: 5000 });
		else setTimeout(startPostHog, 3000);
	};
	if (document.readyState === "complete") go();
	else window.addEventListener("load", go, { once: true });
}
