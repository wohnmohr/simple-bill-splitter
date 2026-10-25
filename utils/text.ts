/**
 * Text people type (names, group names, what an expense was for), made safe to
 * show beside amounts. Control characters and bidi overrides go: an unclosed
 * right-to-left override in "Ben‮" flips the rest of the line, so "owes you
 * ₹300" reads "003₹ uoy sewo". Spaces are single, and the text is cut at whole
 * characters, so an emoji is never split. Joiners stay: emoji and Indic
 * scripts need them.
 */
const UNSAFE = /[\u0000-\u001f\u007f-\u009f؜‎‏‪-‮⁦-⁩﻿]/g;

export const cleanText = (value: string, max: number): string =>
	Array.from(value.normalize("NFC").replace(UNSAFE, " ").replace(/\s+/g, " ").trim())
		.slice(0, max)
		.join("")
		.trim();
