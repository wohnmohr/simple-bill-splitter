"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import type { ShareSnapshot } from "@/types/share";
import { IMPORT_LIMIT_MESSAGE, importShareSnapshot } from "@/utils/shareImport";

type Props = {
	heading: string;
	body: string;
	/** Builds the group from the split as it stands now. */
	toGroup: () => { snapshot: ShareSnapshot; meId: string };
	/** Shown when there's nobody to put in the group yet. */
	emptyMessage: string;
	onSaved: (snapshot: ShareSnapshot) => void;
};

/** The organiser's way from a split link to a group: everyone in it becomes a member, and the app opens on it. */
export const SaveAsGroupCard = ({ heading, body, toGroup, emptyMessage, onSaved }: Props) => {
	const [error, setError] = useState("");

	const save = () => {
		const { snapshot, meId } = toGroup();
		const result = importShareSnapshot(snapshot, meId);
		if (!result.ok) return setError(result.reason === "limit" ? IMPORT_LIMIT_MESSAGE : emptyMessage);
		onSaved(snapshot);
		window.location.assign("/dashboard");
	};

	return (
		<section aria-labelledby="save-as-group" className="rounded-xl border border-brand-100 bg-brand-50 p-4">
			<h2 id="save-as-group" className="flex items-center gap-2 font-semibold text-ink">
				<Users className="h-4 w-4 text-brand-700" /> {heading}
			</h2>
			<p className="mt-1 text-sm text-ink-soft">{body}</p>
			<button type="button" onClick={save} className="btn-primary mt-3 w-full !justify-center">
				Save as a group
			</button>
			{error && (
				<p role="alert" className="mt-2 text-sm text-negative">
					{error}
				</p>
			)}
		</section>
	);
};
