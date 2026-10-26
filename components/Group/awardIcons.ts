import { createElement } from "react";
import { Check, Coffee, Crown, HeartHandshake, Moon, ReceiptText, Users, Zap, type LucideIcon } from "lucide-react";
import type { AwardId } from "@/utils/awards";
import type { CardIcons } from "@/utils/settledCard";

/** Each award's badge: an icon on its own color, the same in the app and on the card. */
export const AWARD_ICONS: Record<AwardId, { Icon: LucideIcon; color: string }> = {
	spender: { Icon: Crown, color: "#d97706" },
	rounds: { Icon: Coffee, color: "#a16207" },
	fastest: { Icon: Zap, color: "#0284c7" },
	nightOwl: { Icon: Moon, color: "#4f46e5" },
	bigBill: { Icon: ReceiptText, color: "#059669" },
	allIn: { Icon: Users, color: "#db2777" },
	company: { Icon: HeartHandshake, color: "#e11d48" },
};


/** White icons for the story card: these awards' badges and the "settled" check. */
export const loadCardIcons = async (ids: AwardId[]): Promise<CardIcons> => {
	// Only the card needs icons as images, so the renderer loads with it.
	const { renderToStaticMarkup } = await import("react-dom/server");
	const iconImage = async (Icon: LucideIcon) => {
		const svg = renderToStaticMarkup(createElement(Icon, { size: 96, color: "#ffffff", strokeWidth: 2.25 }));
		const img = new Image();
		img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
		await img.decode();
		return img;
	};
	const unique = [...new Set(ids)];
	const [check, ...imgs] = await Promise.all([iconImage(Check), ...unique.map((id) => iconImage(AWARD_ICONS[id].Icon))]);
	return { check, badges: Object.fromEntries(unique.map((id, i) => [id, { img: imgs[i], color: AWARD_ICONS[id].color }])) };
};
