"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, PostHogErrorBoundary } from "@posthog/react";

function PostHogPageView() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		if (!pathname || !posthog.__loaded) return;
		const query = searchParams?.toString();
		const url = query ? `${pathname}?${query}` : pathname;
		posthog.capture("$pageview", { $current_url: url });
	}, [pathname, searchParams]);

	return null;
}

function ErrorFallback() {
	return (
		<div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
			<p className="text-lg font-semibold text-gray-900">Something went wrong</p>
			<p className="text-sm text-gray-600">
				Try refreshing the page. If it keeps happening, open SplitBiller from the
				home page.
			</p>
			<a
				href="/"
				className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
			>
				Go home
			</a>
		</div>
	);
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
		if (!key || posthog.__loaded) return;

		posthog.init(key, {
			api_host:
				process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
			person_profiles: "identified_only",
			capture_pageview: false, // we send on route change
			capture_pageleave: true,
			persistence: "localStorage+cookie",
			// Session replay — enable in PostHog Project Settings → Session replay
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
				const message: unknown =
					props.$exception_list?.[0]?.value ?? props.$exception_message;
				return message === "Script error." ? null : event;
			},
			loaded: (client) => {
				client.startExceptionAutocapture?.();
				client.startSessionRecording?.();
				if (process.env.NODE_ENV === "development") {
					client.debug(false);
				}
			},
		});
	}, []);

	return (
		<PHProvider client={posthog}>
			<PostHogErrorBoundary
				fallback={ErrorFallback}
				additionalProperties={{ source: "react_error_boundary" }}
			>
				<Suspense fallback={null}>
					<PostHogPageView />
				</Suspense>
				{children}
			</PostHogErrorBoundary>
		</PHProvider>
	);
}
