"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders a UPI intent as a QR any phone's UPI app can scan. */
export const UpiQr = ({
	link,
	label,
	className = "h-36 w-36",
}: {
	link: string;
	label: string;
	className?: string;
}) => {
	const [svg, setSvg] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		QRCode.toString(link, {
			type: "svg",
			margin: 0,
			errorCorrectionLevel: "M",
			color: { dark: "#1c1826", light: "#ffffff" },
		})
			.then((markup) => {
				if (!cancelled) setSvg(markup);
			})
			.catch(() => {
				if (!cancelled) setSvg(null);
			});
		return () => {
			cancelled = true;
		};
	}, [link]);

	return (
		<div
			role="img"
			aria-label={label}
			className={`${className} shrink-0 rounded-xl border border-line bg-white p-2.5 [&>svg]:h-full [&>svg]:w-full`}
			// QR markup is generated locally from the UPI link; nothing user-authored is injected.
			dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
		/>
	);
};

/**
 * True on devices that can hand a upi:// link to an installed UPI app
 * (phones and tablets). Desktop browsers can't, so they get a QR instead.
 * Starts false on the server and settles on mount to avoid hydration drift.
 */
export const useCanOpenUpiApps = (): boolean | null => {
	const [can, setCan] = useState<boolean | null>(null);
	useEffect(() => {
		const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
		const mobileUa = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
		setCan(touch || mobileUa);
	}, []);
	return can;
};
