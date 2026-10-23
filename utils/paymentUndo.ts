/** The payments the Undo on screen takes back, and the group they're in. */
export type PaymentUndo = { toastId: number; groupId: string; ids: string[] };

/**
 * Payments marked one after another share one Undo, so taking it back never
 * leaves an earlier one marked paid. Joins `last` only while its toast is
 * still the one showing, in the same group.
 */
export const nextPaymentUndo = (
	last: PaymentUndo | null,
	showingToastId: number | undefined,
	groupId: string,
	added: string[],
	toastId: number
): PaymentUndo => ({
	toastId,
	groupId,
	ids: last && last.toastId === showingToastId && last.groupId === groupId ? [...last.ids, ...added] : added,
});
