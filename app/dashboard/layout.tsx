import type { Metadata } from "next";

export { MantineScope as default } from "@/components/providers/MantineScope";

// Without its own title the app shell copies the home page's, and Google sees two pages competing for one query.
export const metadata: Metadata = {
	title: "Your groups | SplitBiller",
	description: "Open SplitBiller to add expenses, see who owes whom and settle up by UPI. No signup; groups stay on your phone.",
	alternates: { canonical: "/dashboard" },
};
