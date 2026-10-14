import type { Person } from "@/types";
import { memberHue } from "@/utils/identity";

const SIZES = { sm: "h-7 w-7 text-sm", md: "h-9 w-9 text-lg", lg: "h-14 w-14 text-3xl" } as const;

/**
 * A member's avatar: their animal if they joined with one, else their initial on
 * a tint from their id, so two people named alike still look different.
 */
export const MemberAvatar = ({ person, size = "md" }: { person: Pick<Person, "id" | "name" | "avatar">; size?: keyof typeof SIZES }) => (
	<span
		aria-hidden
		className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-ink-soft ${SIZES[size]}`}
		style={{ backgroundColor: `hsl(${memberHue(person.avatar ?? person.id)} 70% 55% / 0.2)` }}
	>
		{person.avatar ?? (person.name.trim().charAt(0).toUpperCase() || "?")}
	</span>
);
