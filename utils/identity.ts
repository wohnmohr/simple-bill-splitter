import type { Group, Person } from "@/types";

/**
 * Anonymous identities for group members. Someone joining a shared group gets
 * an animal avatar and a two-word handle ("Teal Otter") instead of having to
 * give their name. They can rename themselves for everyone, and anyone can
 * give a member a nickname that stays on their own device.
 */

const ANIMALS: Record<string, string> = {
	"🦊": "Fox", "🐼": "Panda", "🦉": "Owl", "🐯": "Tiger", "🦦": "Otter",
	"🐙": "Octopus", "🦜": "Parrot", "🐳": "Whale", "🦔": "Hedgehog", "🐨": "Koala",
	"🦩": "Flamingo", "🐢": "Turtle", "🦁": "Lion", "🐧": "Penguin", "🦄": "Unicorn",
	"🐝": "Bee", "🦋": "Butterfly", "🐬": "Dolphin", "🦒": "Giraffe", "🐸": "Frog",
};
const ADJECTIVES = [
	"Teal", "Saffron", "Amber", "Coral", "Indigo", "Jade", "Ruby", "Misty", "Sunny", "Swift",
	"Quiet", "Brave", "Lucky", "Clever", "Gentle", "Bold", "Cosmic", "Breezy", "Mellow", "Zesty",
];

export const AVATARS = Object.keys(ANIMALS);
export const isAvatar = (v: unknown): v is string => typeof v === "string" && v in ANIMALS;

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/** A fresh avatar and handle, avoiding avatars and names already in the group where possible. */
export function newIdentity(members: Person[]): { name: string; avatar: string } {
	const usedAvatars = new Set(members.map((m) => m.avatar));
	const usedNames = new Set(members.map((m) => m.name.toLowerCase()));
	const free = AVATARS.filter((a) => !usedAvatars.has(a));
	const avatar = pick(free.length ? free : AVATARS);
	let name = "";
	for (let i = 0; i < 20 && (!name || usedNames.has(name.toLowerCase())); i++) name = `${pick(ADJECTIVES)} ${ANIMALS[avatar]}`;
	return { name, avatar };
}

/** A stable hue for a member, from their id, so two people with the same name still look different. */
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
