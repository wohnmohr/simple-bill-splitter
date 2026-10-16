"use client";

import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { handOffQuickAdd } from "@/utils/quickAddHandoff";
import { QuickAddBox } from "@/components/QuickAdd/QuickAddBox";

/** Type the first expense on the home page; the dashboard previews it as a new group. */
export const HeroQuickAdd = () => {
	const router = useRouter();

	const start = (text: string) => {
		track("landing_cta_clicked", { location: "hero_quick_add" });
		handOffQuickAdd(text);
		router.push("/dashboard");
	};

	return (
		<div className="mx-auto mt-8 max-w-xl text-left lg:mx-0">
			<p className="mb-2 flex items-center justify-center gap-2 text-sm font-medium text-ink-soft lg:justify-start">
				Type a bill to start a group
				<span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-brand-700">
					Beta
				</span>
			</p>
			<QuickAddBox label="Start a group by typing a bill" onSubmit={start} />
		</div>
	);
};
