"use client";

import { useCallback, useRef, useState } from "react";
import { parseOrderText, type ParsedOrder } from "@/utils/orderBill";
import { secondsBucket, track } from "@/lib/analytics";

export type ScanState =
	| { status: "idle" }
	| { status: "reading"; progress: number; step: string }
	| { status: "done"; order: ParsedOrder }
	| { status: "error"; message: string };

/** Reads an order screenshot on this device and parses it. */
export function useOrderScan(where: string) {
	const [state, setState] = useState<ScanState>({ status: "idle" });
	// Bumped by each scan and by reset(): a scan that isn't the latest is ignored when it ends.
	const latest = useRef(0);

	const scan = useCallback(
		async (file: File | Blob): Promise<ParsedOrder | null> => {
			if (!file.type.startsWith("image/")) {
				setState({ status: "error", message: "That isn't an image. Pick a screenshot of the order." });
				return null;
			}
			const token = ++latest.current;
			const current = () => token === latest.current;
			track("order_scan_started", { where });
			const started = Date.now();
			const seconds = () => secondsBucket(Date.now() - started);
			setState({ status: "reading", progress: 0, step: "Starting…" });
			let ocr: typeof import("@/lib/ocr") | undefined;
			try {
				ocr = await import("@/lib/ocr");
				const text = await ocr.readImageText(file, ({ share, step }) => current() && setState({ status: "reading", progress: share, step }));
				if (!current()) return null;
				const order = parseOrderText(text);
				if (!order.items.length && order.total === undefined) {
					track("order_scan_failed", { where, reason: "no_order", seconds: seconds() });
					setState({
						status: "error",
						message: "Couldn’t find an order in that image. Try a screenshot of the order summary, or add the items yourself.",
					});
					return null;
				}
				track("order_scan_read", { where, items: order.items.length, balanced: order.balanced, app: order.app ?? "unknown", seconds: seconds() });
				setState({ status: "done", order });
				return order;
			} catch (err) {
				if (!current()) return null;
				console.error("Order scan failed", err);
				if (ocr && err instanceof ocr.UnreadableImageError) {
					track("order_scan_failed", { where, reason: "unreadable_image", seconds: seconds() });
					setState({ status: "error", message: "Couldn’t open that image. Try another screenshot." });
					return null;
				}
				track("order_scan_failed", { where, reason: "engine", seconds: seconds() });
				setState({ status: "error", message: "The scanner couldn’t start. Check your connection and try again." });
				return null;
			}
		},
		[where]
	);

	const reset = useCallback(() => {
		latest.current++;
		setState({ status: "idle" });
	}, []);
	return { state, scan, reset };
}
