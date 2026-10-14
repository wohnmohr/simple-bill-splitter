import type { Metadata } from "next";
import { PageFrame } from "@/components/PayStory/PageFrame";
import { CloudSplitApp } from "@/components/PayStory/CloudSplitApp";
import { SPLIT_ID_RE } from "@/utils/splitVault";

// The split is ciphertext on our side; its key is in the link's #fragment and never reaches us.
export const metadata: Metadata = {
	title: "Pay your share | SplitBiller",
	description: "Pay your share of a split by UPI. End-to-end encrypted, updates live.",
	robots: { index: false, follow: false },
	referrer: "no-referrer",
};

export default async function CloudSplitPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return (
		<PageFrame wide>
			{/* Start fetching the (encrypted) split with the HTML, instead of after the app's JavaScript loads. */}
			{SPLIT_ID_RE.test(id) && <link rel="preload" href={`/api/splits/${id}`} as="fetch" crossOrigin="anonymous" />}
			<CloudSplitApp id={id} />
		</PageFrame>
	);
}
