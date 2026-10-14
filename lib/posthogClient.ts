/**
 * Loads posthog-js on demand, off the critical path.
 *
 * The library is a separate chunk that is fetched only after the page is idle,
 * so it never competes with the first paint or hydration. Anything captured
 * before it is ready is queued with its real timestamp and sent once it loads.
 */
import type { PostHog } from "posthog-js";
import { isPrivatePath, scrubUrl } from "@/lib/privateUrl";

type Job = (ph: PostHog) => void;

const MAX_QUEUED = 100;

/** $current_url, $pathname, $initial_referrer, $session_entry_url and the like. */
const URL_PROP = /(url|pathname|referrer)$/i;
/** A link without its query or fragment: "upi://pay?pa=…&pn=…&am=…" becomes "upi://pay". */
const bareLink = (href: string) => href.split(/[?#]/)[0];

/**
 * PostHog records a clicked link's href even with attribute masking on. Pay,
 * WhatsApp and share links carry UPI IDs, names, amounts and keys in their
 * query or fragment, so only the bare link is kept.
 */
function stripLinks(props: Record<string, unknown> | undefined) {
	if (!props) return;
	if (typeof props.$external_click_url === "string") props.$external_click_url = bareLink(props.$external_click_url);
	if (Array.isArray(props.$elements)) {
		for (const el of props.$elements as Record<string, unknown>[]) {
			for (const k of Object.keys(el)) {
				if (k.startsWith("attr__") && typeof el[k] === "string") el[k] = bareLink(el[k] as string);
			}
		}
	}
	if (typeof props.$elements_chain === "string") {
		props.$elements_chain = props.$elements_chain.replace(/((?:attr__)?href)="([^"]*)"/g, (_m, name: string, href: string) => `${name}="${bareLink(href)}"`);
	}
}

/** Scrubs URL properties so split keys, split ids and shared data never reach analytics. */
function scrubUrls(props: Record<string, unknown> | undefined) {
	if (!props) return;
	for (const [k, v] of Object.entries(props)) {
		if (typeof v === "string" && URL_PROP.test(k)) props[k] = scrubUrl(v);
	}
}
let client: PostHog | null = null;
let starting = false;
const queue: Job[] = [];

/** Development machines and the local network: their clicks aren't users' and would skew the data. */
const LOCAL_HOST = /^(localhost$|127\.|0\.0\.0\.0$|\[::1\]$|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|\.local$/;

export const analyticsEnabled = () =>
	!!process.env.NEXT_PUBLIC_POSTHOG_KEY && typeof window !== "undefined" && !LOCAL_HOST.test(window.location.hostname);

/** Run `job` with the client now if it's ready, otherwise as soon as it is. */
export function withPostHog(job: Job): void {
	if (!analyticsEnabled()) return;
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
	if (!key || !analyticsEnabled() || client || starting) return;
	starting = true;

	import("posthog-js")
		.then(({ default: posthog }) => {
			posthog.init(key, {
				api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
				person_profiles: "identified_only",
				capture_pageview: false, // sent on route change by PostHogPageView
				capture_pageleave: true,
				persistence: "localStorage+cookie",
				// Privacy: names, group titles, amounts and UPI IDs appear on screen and
				// in links. Clicks are tracked by element only, never by their text or
				// attributes (a UPI pay link carries the payee's ID, name and amount).
				mask_all_text: true,
				mask_all_element_attributes: true,
				disable_capture_url_hashes: true, // shared links keep their data and keys in the #fragment
				mask_personal_data_properties: true,
				disable_session_recording: false,
				enable_recording_console_log: false,
				session_recording: {
					// Replays show layout and clicks only: every input and every piece of text is masked.
					maskAllInputs: true,
					maskTextSelector: "*",
					recordCrossOriginIframes: false,
				},
				// Browsers mask errors from cross-origin scripts (extensions, in-app
				// browsers, ad blockers) as "Script error." with no stack — nothing
				// to act on, and it floods the exception feed.
				before_send: (event) => {
					if (!event) return event;
					scrubUrls(event.properties);
					stripLinks(event.properties);
					scrubUrls(event.properties?.$set);
					scrubUrls(event.properties?.$set_once);
					if (event.event === "$snapshot" && isPrivatePath(window.location.pathname)) return null;
					if (event.event !== "$exception") return event;
					const props = event.properties ?? {};
					const message: unknown = props.$exception_list?.[0]?.value ?? props.$exception_message;
					return message === "Script error." ? null : event;
				},
				loaded: (ph) => {
					ph.startExceptionAutocapture?.();
					if (!isPrivatePath(window.location.pathname)) ph.startSessionRecording?.();
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
