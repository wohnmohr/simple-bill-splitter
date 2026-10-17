import type { Metadata } from "next";
import { PageFrame } from "@/components/PayStory/PageFrame";
import { BackupRestore } from "@/components/Group/BackupRestore";

// The backup key is in the link's #fragment; browsers never send it to us.
export const metadata: Metadata = {
	title: "Restore your groups | SplitBiller",
	description: "Bring back your end-to-end encrypted SplitBiller groups on this device.",
	robots: { index: false, follow: false },
	referrer: "no-referrer",
};

export default function RestorePage() {
	return (
		<PageFrame>
			<BackupRestore />
		</PageFrame>
	);
}
