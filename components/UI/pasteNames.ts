import type { ClipboardEvent } from "react";
import { pastedNames } from "@/utils/firstExpense";

/**
 * Pasting a list of names (one per line) into a one-line field: single-line
 * inputs drop the line breaks, which would glue "Farah Gopal Hari" into one
 * person. The lines go in as "Farah, Gopal, Hari" instead.
 */
export function pasteNames(e: ClipboardEvent<HTMLInputElement>, setValue: (value: string) => void) {
	const list = pastedNames(e.clipboardData.getData("text"));
	if (list === null) return;
	e.preventDefault();
	const { value, selectionStart, selectionEnd } = e.currentTarget;
	setValue(value.slice(0, selectionStart ?? value.length) + list + value.slice(selectionEnd ?? value.length));
}
