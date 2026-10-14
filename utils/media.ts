/**
 * True when moving media should wait for a tap: the visitor asked for less
 * data, is on a very slow connection, or prefers reduced motion.
 */
export function prefersStillMedia(): boolean {
	const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
	const savingData = !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ""));
	return savingData || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
