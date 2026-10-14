import type { Person } from "@/types";
import { memberHue } from "@/utils/identity";

const SIZES = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-14 w-14 text-2xl" } as const;

/**
 * A member's avatar: their initial on a tint from their id, so two people with
 * the same initial or name still look different.
 */
export const MemberAvatar = ({ person, size = "md" }: { person: Pick<Person, "id" | "name">; size?: keyof typeof SIZES }) => (
	<span
		aria-hidden
		className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-ink-soft ${SIZES[size]}`}
		style={{ backgroundColor: `hsl(${memberHue(person.id)} 70% 55% / 0.2)` }}
	>
		{person.name.trim().charAt(0).toUpperCase() || "?"}
	</span>
);
