import { useEffect } from "react";
import type { Group } from "@/types";
import { type Award, type AwardHolders, awardNews, holdersOf } from "@/utils/awards";

const KEY = "splitbiller-awards";

/** Who held each award when this device last looked, by group id. Stays on the device. */
const load = (): Record<string, AwardHolders> => {
	try {
		return JSON.parse(localStorage.getItem(KEY) ?? "{}");
	} catch {
		return {};
	}
};

/**
 * Says when one of your awards changed hands since you last looked at the
 * group ("Riya took your Chai sponsor"). The first look only remembers.
 */
export function useAwardNews(group: Group | undefined, awards: Award[], nameOf: (id: string) => string, say: (message: string) => void) {
	const holders = holdersOf(awards);
	const seen = JSON.stringify(holders);
	const groupId = group?.id;
	const meId = group?.meId;
	useEffect(() => {
		if (!groupId) return;
		const all = load();
		const before = all[groupId];
		try {
			localStorage.setItem(KEY, JSON.stringify({ ...all, [groupId]: holders }));
		} catch {
			/* storage unavailable: no news, nothing else changes */
		}
		const news = before && meId ? awardNews(before, awards, meId) : null;
		if (!news) return;
		const { title } = news.award;
		say(
			news.gained
				? `You're the ${title} now${news.other ? `, taking it from ${nameOf(news.other)}` : ""}`
				: `${nameOf(news.other!)} took your ${title}`
		);
		// Only a change in who holds what is news; `seen` stands for `holders` and `awards`.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [groupId, meId, seen]);
}
