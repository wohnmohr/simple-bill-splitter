import type { Metadata } from "next";
import { PageFrame } from "@/components/PayStory/PageFrame";
import { PayStoryApp } from "@/components/PayStory/PayStoryApp";

// Every shared split shares this URL (the data is in the #fragment), so keep it out of search.
export const metadata: Metadata = {
	title: "Pay your share | SplitBiller",
	description: "Pay your share of a split by UPI and see who has paid.",
	robots: { index: false, follow: true },
};

export default function PayStoryPage() {
	return (
		<PageFrame wide>
			<PayStoryApp />
		</PageFrame>
	);
}
