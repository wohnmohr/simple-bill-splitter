import type { Metadata } from "next";
import { PageFrame } from "@/components/PayStory/PageFrame";
import { GroupJoin } from "@/components/Group/GroupJoin";

// The group key is in the link's #fragment; browsers never send it to us.
export const metadata: Metadata = {
	title: "Join group | SplitBiller",
	description: "Open an end-to-end encrypted SplitBiller group and add expenses together.",
	// What WhatsApp and others show under the preview card (app/g/opengraph-image.tsx).
	openGraph: {
		title: "Open your group on SplitBiller",
		description: "See what you owe, pay your share by UPI and add expenses together. End-to-end encrypted.",
		siteName: "SplitBiller",
	},
	twitter: {
		card: "summary_large_image",
		title: "Open your group on SplitBiller",
		description: "See what you owe, pay your share by UPI and add expenses together. End-to-end encrypted.",
	},
	robots: { index: false, follow: false },
	referrer: "no-referrer",
};

export default function JoinGroupPage() {
	return (
		<PageFrame>
			<GroupJoin />
		</PageFrame>
	);
}
