import type { Metadata } from "next";
import { PageFrame } from "@/components/PayStory/PageFrame";
import { GroupJoin } from "@/components/Group/GroupJoin";

// The group key is in the link's #fragment; browsers never send it to us.
export const metadata: Metadata = {
	title: "Join group | SplitBiller",
	description: "Open an end-to-end encrypted SplitBiller group and add expenses together.",
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
