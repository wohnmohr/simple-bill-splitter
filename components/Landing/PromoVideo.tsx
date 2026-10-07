"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { track } from "@/lib/analytics";

// Hosted on Cloudflare R2. Set NEXT_PUBLIC_PROMO_VIDEO_URL to move it (e.g. to a custom domain).
const SRC =
	process.env.NEXT_PUBLIC_PROMO_VIDEO_URL ||
	"https://pub-5d49a949610d47a590f022b4cb5de7e6.r2.dev/video.mp4";
const POSTER = "/promo/splitbiller-promo-poster.jpg";
const LABEL =
	"SplitBiller in 30 seconds: add the bills, see who owes whom, settle by UPI, and the free tools";

/** True when the visitor asked for less data, or is on a very slow connection. */
const savingData = () => {
	const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
		.connection;
	return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ""));
};

/**
 * The homepage promo, built to cost the page nothing until it's wanted.
 *
 * - Until the visitor is about a screen away, the page holds only an empty
 *   placeholder box: no poster, no video, no connection to the video host,
 *   nothing competing with the first paint.
 * - Then the player mounts and fetches just the metadata; it plays muted once
 *   half of it is visible and pauses when it leaves, unless the visitor
 *   paused it.
 * - With data saver on, a very slow connection, or reduced-motion preferred,
 *   only the poster loads and nothing plays until they tap play.
 */
export const PromoVideo = () => {
	const box = useRef<HTMLDivElement>(null);
	const video = useRef<HTMLVideoElement>(null);
	const userPaused = useRef(false);
	const ourPause = useRef(false);
	const unmutedReported = useRef(false);
	const wantsPlay = useRef(false);
	const [near, setNear] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [manualOnly, setManualOnly] = useState(false);
	const [failed, setFailed] = useState(false);

	const start = useCallback(() => {
		wantsPlay.current = true;
		setNear(true);
		setMounted(true);
	}, []);

	// Mount the player shortly before it scrolls into view — never earlier.
	useEffect(() => {
		const el = box.current;
		if (!el) return;
		const manual = savingData() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		setManualOnly(manual);
		if (!("IntersectionObserver" in window)) {
			setNear(true);
			return setMounted(!manual);
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setNear(true);
					setMounted(!manual);
					observer.disconnect();
				}
			},
			{ rootMargin: "400px 0px" }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// Once mounted: play when half visible, pause when away.
	useEffect(() => {
		const el = video.current;
		if (!mounted || !el) return;
		if (wantsPlay.current) el.play().catch(() => {});
		if (manualOnly && !wantsPlay.current) return;
		if (!("IntersectionObserver" in window)) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					if (!userPaused.current) el.play().catch(() => {});
				} else if (!el.paused) {
					ourPause.current = true;
					el.pause();
				}
			},
			{ threshold: 0.5 }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [mounted, manualOnly]);

	if (failed) {
		return (
			<div className="surface relative w-full overflow-hidden shadow-raised">
				<img src={POSTER} alt="SplitBiller: see who owes whom" width={1280} height={720} decoding="async" className="block aspect-video w-full object-cover" />
				<p className="absolute inset-x-0 bottom-0 bg-ink/70 px-4 py-2 text-center text-sm text-white">
					The video couldn&apos;t load right now.
				</p>
			</div>
		);
	}

	return (
		<div ref={box} className="surface relative w-full overflow-hidden shadow-raised">
			{mounted ? (
				<video
					ref={video}
					className="block aspect-video w-full bg-paper"
					src={SRC}
					poster={POSTER}
					muted
					loop
					playsInline
					controls
					preload="metadata"
					aria-label={LABEL}
					onError={() => setFailed(true)}
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
			) : (
				<>
					{near ? (
						<img
							src={POSTER}
							alt=""
							width={1280}
							height={720}
							decoding="async"
							className="block aspect-video w-full object-cover"
						/>
					) : (
						<div className="aspect-video w-full bg-brand-50" aria-hidden />
					)}
					<button
						type="button"
						onClick={start}
						aria-label={`Play video: ${LABEL}`}
						className="absolute inset-0 flex items-center justify-center bg-ink/5 transition-colors hover:bg-ink/10"
					>
						<span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-700 text-white shadow-raised">
							<Play className="ml-1 h-7 w-7" fill="currentColor" />
						</span>
					</button>
				</>
			)}
		</div>
	);
};
