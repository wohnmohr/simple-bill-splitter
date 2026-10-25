import { useEffect, useRef } from "react";
import { openLayer } from "@/utils/backStack";

/** While `open`, the phone/browser Back button calls `onClose` instead of leaving the app. */
export const useBackClose = (open: boolean, onClose: () => void, under = false) => {
	const close = useRef(onClose);
	close.current = onClose;
	useEffect(() => (open ? openLayer(() => close.current(), under) : undefined), [open, under]);
};
