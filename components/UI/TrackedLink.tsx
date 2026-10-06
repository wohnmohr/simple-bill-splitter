"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
	/** Where on the page this link lives, sent as `location` with landing_cta_clicked. */
	location: string;
};

/** A Link that reports a landing_cta_clicked event, usable from server components. */
export const TrackedLink = ({ location, onClick, ...props }: Props) => (
	<Link
		{...props}
		onClick={(e) => {
			track("landing_cta_clicked", { location });
			onClick?.(e);
		}}
	/>
);
