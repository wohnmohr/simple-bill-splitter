"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { prefersStillMedia } from "@/utils/media";

type Props = { name: string; width: number; height: number; label: string; caption?: [string, string] };

/**
 * A short screen recording that behaves like a GIF: muted, looping, and
 * playing only while it's on screen. Nothing loads until it's about a screen
 * away; with data saver or reduced motion it waits for a tap. The corner
 * button pauses it, and a pause sticks until they press play again.
 */
export const FeatureClip = ({ name, width, height, label, caption }: Props) => {
	const box = useRef<HTMLDivElement>(null);
	const video = useRef<HTMLVideoElement>(null);
	const held = useRef(false);
	const [near, setNear] = useState(false);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		const el = box.current;
		if (!el) return;
		held.current = prefersStillMedia();
		if (!("IntersectionObserver" in window)) return setNear(true);
		const observer = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), observer.disconnect()), { rootMargin: "600px 0px" });
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const el = video.current;
		if (!near || !el || !("IntersectionObserver" in window)) return;
		const observer = new IntersectionObserver(
			([e]) => {
				if (!e.isIntersecting) el.pause();
				else if (!held.current) el.play().catch(() => {});
			},
			{ threshold: 0.5 }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [near]);

	const toggle = () => {
		const el = video.current;
		if (!el) return;
		held.current = !el.paused;
		if (el.paused) el.play().catch(() => {});
		else el.pause();
	};

	return (
		<figure className="mx-auto w-full" style={{ maxWidth: caption ? 620 : 320 }}>
			<div className="relative">
				<div
					ref={box}
					className="relative overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-raised"
					style={{ aspectRatio: `${width} / ${height}` }}
				>
					{near && (
						<video
							ref={video}
							className="absolute inset-0 h-full w-full"
							src={`/features/${name}.mp4`}
							poster={`/features/${name}.webp`}
							width={width}
							height={height}
							muted
							loop
							playsInline
							preload="none"
							aria-label={label}
							onPlay={() => setPlaying(true)}
							onPause={() => setPlaying(false)}
						/>
					)}
				</div>
				{/* Outside the frame, so it never reads as part of the recorded screen. */}
				<button
					type="button"
					onClick={toggle}
					aria-label={playing ? `Pause: ${label}` : `Play: ${label}`}
					className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-raised transition-colors hover:text-brand-700"
				>
					{playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
				</button>
			</div>
			{caption && (
				<figcaption className="mt-4 grid grid-cols-2 text-center text-sm font-medium text-ink-muted">
					<span>{caption[0]}</span>
					<span>{caption[1]}</span>
				</figcaption>
			)}
		</figure>
	);
};
