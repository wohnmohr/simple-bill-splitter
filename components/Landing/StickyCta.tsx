"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { TrackedLink } from "@/components/UI/TrackedLink";

/**
 * Mobile-only bar that appears once the hero CTA has scrolled out of view,
 * so the primary action is always one tap away on a long page.
 */
export const StickyCta = ({ targetId }: { targetId: string }) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const target = document.getElementById(targetId);
		if (!target) return;
		const observer = new IntersectionObserver(([entry]) =>
			// Only show after scrolling *past* the hero, not before it renders.
			setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
		);
		observer.observe(target);
		return () => observer.disconnect();
	}, [targetId]);

	return (
		<div
			aria-hidden={!visible}
			className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 pt-3 backdrop-blur-md transition-transform duration-200 sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
				visible ? "translate-y-0" : "translate-y-full"
			}`}
		>
			<TrackedLink
				href="/dashboard"
				location="sticky"
				tabIndex={visible ? 0 : -1}
				className="btn-primary w-full !py-3 !text-base"
			>
				Start splitting — it&apos;s free
				<ArrowRight className="h-4 w-4" />
			</TrackedLink>
		</div>
	);
};
