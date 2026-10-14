import type { Group, Person } from "@/types";

/**
 * Anonymous identities for group members. Someone joining a shared group gets
 * a made-up, pronounceable name ("Zuvoka", "Brelix") instead of having to give
 * their own. They can rename themselves for everyone, and anyone can give a
 * member a nickname that stays on their own device.
 */

// Two syllables and an optional ending: 20 × 6 × 20 × 6 × 8 ≈ 115,000 names.
const ONSETS = ["b", "d", "f", "g", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "z", "bl", "br", "dr", "kr", "pl"];
const VOWELS = ["a", "e", "i", "o", "u", "oo"];
const ENDINGS = ["", "", "", "n", "x", "r", "sh", "k"];

/**
 * Rejects made-up names that spell or sound like something rude, in English
 * or Hindi. Generous on purpose: losing a harmless name costs nothing.
 */
const RUDE =
	/fuk|fuc|fak|sex|seks|dik|dic|cok|kok|cum|kum|tit|ass|arse|anus|pis|poo|shit|sht|crap|cunt|kunt|twat|fag|nig|neg|rap|kil|die|ded|dum|bum|butt|porn|nud|pee|vag|bobo|boob|nipl|homo|gay|kut|chut|lun|lund|lond|gand|gaan|ran|rand|bhen|mada|madar|chod|bsdk|bhos|loda|lode|lavd|lawd|gadh|kame|haram|tatt|jhat|pad|mut|suar|sur|kutt/;

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

const madeUpName = () => {
	const word = pick(ONSETS) + pick(VOWELS) + pick(ONSETS) + pick(VOWELS) + pick(ENDINGS);
	return word.charAt(0).toUpperCase() + word.slice(1);
};

/** A fresh made-up name for someone joining, never one the group already has. */
export function newIdentity(members: Person[]): { name: string } {
	const used = new Set(members.map((m) => m.name.trim().toLowerCase()));
	for (let i = 0; i < 200; i++) {
		const name = madeUpName();
		if (!used.has(name.toLowerCase()) && !RUDE.test(name.toLowerCase())) return { name };
	}
	// Practically unreachable (a group would need tens of thousands of members); add a number.
	let base = madeUpName();
	while (RUDE.test(base.toLowerCase())) base = madeUpName();
	let n = 2;
	while (used.has(`${base} ${n}`.toLowerCase())) n++;
	return { name: `${base} ${n}` };
}

/** A stable hue for a member, from their id, so two people with the same initial or name still look different. */
export function memberHue(id: string): number {
	let h = 0;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
	return h % 360;
}

/**
 * The members as this device shows them: with its private nicknames in place
 * of shared names. Use for display only; anything shared (sync, share links)
 * must use the group's own members.
 */
export function shownMembers(group: Pick<Group, "members" | "nicknames">): Person[] {
	const nick = group.nicknames;
	if (!nick) return group.members;
	return group.members.map((m) => (nick[m.id] ? { ...m, name: nick[m.id] } : m));
}
