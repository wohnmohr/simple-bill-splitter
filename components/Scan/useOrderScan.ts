"use client";

import { useCallback, useState } from "react";
import { parseOrderText, type ParsedOrder } from "@/utils/orderBill";
import { track } from "@/lib/analytics";

export type ScanState =
	| { status: "idle" }
	| { status: "reading"; progress: number }
	| { status: "done"; order: ParsedOrder }
	| { status: "error"; message: string };

/** Reads an order screenshot on this device and parses it. */
export function useOrderScan(where: string) {
	const [state, setState] = useState<ScanState>({ status: "idle" });

	const scan = useCallback(
		async (file: File | Blob): Promise<ParsedOrder | null> => {
			if (!file.type.startsWith("image/")) {
				setState({ status: "error", message: "That isn't an image. Pick a screenshot of the order." });
				return null;
			}
			track("order_scan_started", { where });
			setState({ status: "reading", progress: 0 });
			try {
				const { readImageText } = await import("@/lib/ocr");
				const text = await readImageText(file, (progress) => setState({ status: "reading", progress }));
				const order = parseOrderText(text);
				if (!order.items.length && order.total === undefined) {
					track("order_scan_failed", { where, reason: "no_order" });
					setState({
						status: "error",
						message: "Couldn’t find an order in that image. Try a screenshot of the order summary, or add the items yourself.",
					});
					return null;
				}
				track("order_scan_read", { where, items: order.items.length, balanced: order.balanced, app: order.app ?? "unknown" });
				setState({ status: "done", order });
				return order;
			} catch (err) {
				console.error("Order scan failed", err);
				track("order_scan_failed", { where, reason: "engine" });
				setState({ status: "error", message: "The scanner couldn’t start. Check your connection and try again." });
				return null;
			}
		},
		[where]
	);

	const reset = useCallback(() => setState({ status: "idle" }), []);
	return { state, scan, reset };
}
