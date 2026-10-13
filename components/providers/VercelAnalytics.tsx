"use client";

import { Analytics } from "@vercel/analytics/react";
import { scrubUrl } from "@/lib/privateUrl";

/** Vercel Analytics, minus split ids and #fragments. */
export const VercelAnalytics = () => <Analytics beforeSend={(event) => ({ ...event, url: scrubUrl(event.url) })} />;
