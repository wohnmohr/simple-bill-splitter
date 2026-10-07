"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

const SRC = "/promo/splitbiller-promo.mp4";
const POSTER = "/promo/splitbiller-promo-poster.jpg";

/**
 * The homepage promo. Plays muted while at least half of it is on screen and
 * pauses when it scrolls away, unless the visitor paused it themselves.
 * Sound is theirs to turn on; people who prefer reduced motion get a still
 * poster and press play.
 */
export const PromoVideo = () => {
	const ref = useRef<HTMLVideoElement>(null);
	const userPaused = useRef(false);
	const ourPause = useRef(false);
	const unmutedReported = useRef(false);

	useEffect(() => {
		const video = ref.current;
		if (!video || !("IntersectionObserver" in window)) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					if (!userPaused.current) video.play().catch(() => {});
				} else if (!video.paused) {
					ourPause.current = true;
					video.pause();
				}
			},
			{ threshold: 0.5 }
		);
		observer.observe(video);
		return () => observer.disconnect();
	}, []);

	return (
		<div className="surface w-full overflow-hidden shadow-raised">
			<video
				ref={ref}
				className="block aspect-video w-full bg-paper"
				src={SRC}
				poster={POSTER}
				muted
				loop
				playsInline
				controls
				preload="metadata"
				aria-label="SplitBiller in 30 seconds: add the bills, see who owes whom, settle by UPI, and the free tools"
				onPlay={() => (userPaused.current = false)}
				onPause={(e) => {
					// A pause we didn't cause (and not the loop ending) means the visitor did it.
					if (!ourPause.current && !e.currentTarget.ended) userPaused.current = true;
					ourPause.current = false;
				}}
				onVolumeChange={(e) => {
					if (!e.currentTarget.muted && !unmutedReported.current) {
						unmutedReported.current = true;
						track("landing_video_unmuted");
					}
				}}
			/>
		</div>
	);
};
