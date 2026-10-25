/**
 * Text people type (names, group names, what an expense was for), made safe to
 * show beside amounts. Control characters and bidi overrides go: an unclosed
 * right-to-left override in "Ben‮" flips the rest of the line, so "owes you
 * ₹300" reads "003₹ uoy sewo". Characters that show as nothing (zero-width
 * space, soft hyphen, Hangul fillers, tags) go too, so "Asha" with one hidden
 * inside can't pass for a second Asha. Spaces are single, and the text is cut
 * at whole characters, so an emoji is never split. Joiners stay: emoji and
 * Indic scripts need them.
 */
const UNSAFE = /[\u0000-\u001f\u007f-\u009f؜‎‏‪-‮⁦-⁩﻿]/g;
const INVISIBLE = /[\u00ad\u034f\u115f\u1160\u17b4\u17b5\u180b-\u180e\u200b\u2060-\u2064\u206a-\u206f\u3164\uffa0\ufff9-\ufffb\u{e0000}-\u{e007f}]/gu;

export const cleanText = (value: string, max: number): string =>
	Array.from(value.normalize("NFC").replace(INVISIBLE, "").replace(UNSAFE, " ").replace(/\s+/g, " ").trim())
		.slice(0, max)
		.join("")
		.trim();

// Cyrillic and Greek letters that look like Latin ones (after lowercasing, so "А" and "В" are covered too).
const LOOKALIKE_FROM = "аеорсухіјѕԁһӏԛԝвкмнтαβεηικμνορτυχζ";
const LOOKALIKE_TO = "aeopcyxijsdhlqwbkmhtabehikmnoptyxz";

/**
 * How a name is compared with the names already in a group: "asha", "Asha "
 * and an "Аsha" typed with a Cyrillic А are the same, so two people never look alike.
 */
export const nameKey = (name: string) =>
	Array.from(cleanText(name, 40).normalize("NFKC").toLowerCase(), (c) => {
		const i = LOOKALIKE_FROM.indexOf(c);
		return i < 0 ? c : LOOKALIKE_TO[i];
	}).join("");
