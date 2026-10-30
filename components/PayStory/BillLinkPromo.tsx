import { ArrowRight, ScanLine } from "lucide-react";
import { TrackedLink } from "@/components/UI/TrackedLink";

/** Points people at "tap what you ate". Server-safe: a plain tracked link. */
export const BillLinkPromo = ({ location, className = "" }: { location: string; className?: string }) => (
	<TrackedLink
		href="/split/by-item"
		location={location}
		className={`group flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-left transition-colors hover:bg-brand-100 sm:p-5 ${className}`}
	>
		<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
			<ScanLine className="h-5 w-5" />
		</span>
		<span className="min-w-0 flex-1">
			<span className="block font-semibold text-ink">
				<span className="mr-2 rounded-full bg-brand-700 px-2 py-0.5 align-middle text-xs font-semibold text-on-brand">New</span>
				Scan the bill, friends tap what they ate
			</span>
			<span className="mt-0.5 block text-sm text-ink-soft">One link. Everyone picks their dishes and pays their exact share by UPI.</span>
		</span>
		<ArrowRight className="h-5 w-5 shrink-0 text-brand-700 transition-transform group-hover:translate-x-0.5" />
	</TrackedLink>
);
