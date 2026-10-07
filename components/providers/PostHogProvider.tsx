"use client";

import { Component, ReactNode, Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackError } from "@/lib/analytics";
import { capture, startPostHogWhenIdle } from "@/lib/posthogClient";

function PostHogPageView() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		if (!pathname) return;
		const query = searchParams?.toString();
		capture("$pageview", { $current_url: query ? `${pathname}?${query}` : pathname });
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

/** Catches render errors, shows a friendly fallback and reports them. */
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	componentDidCatch(error: Error) {
		trackError(error, { source: "react_error_boundary" });
	}

	render() {
		return this.state.failed ? <ErrorFallback /> : this.props.children;
	}
}

export function PostHogProvider({ children }: { children: ReactNode }) {
	// Analytics loads after the page is idle, never during first paint or hydration.
	useEffect(() => {
		startPostHogWhenIdle();
	}, []);

	return (
		<ErrorBoundary>
			<Suspense fallback={null}>
				<PostHogPageView />
			</Suspense>
			{children}
		</ErrorBoundary>
	);
}
