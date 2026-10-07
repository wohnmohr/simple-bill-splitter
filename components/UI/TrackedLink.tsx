"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
	/** Where on the page this link lives, sent as `location` with landing_cta_clicked. */
	location: string;
	/** Extra context sent with the event, e.g. which tool was chosen. */
	properties?: Record<string, string>;
};

/** A Link that reports a landing_cta_clicked event, usable from server components. */
export const TrackedLink = ({ location, properties, onClick, ...props }: Props) => (
	<Link
		{...props}
		onClick={(e) => {
			track("landing_cta_clicked", { location, ...properties });
			onClick?.(e);
		}}
	/>
);
