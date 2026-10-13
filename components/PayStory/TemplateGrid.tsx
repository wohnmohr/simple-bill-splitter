import Link from "next/link";
import { TEMPLATES, type SplitTemplate } from "@/utils/payStory";

export const themeGradient = (t: SplitTemplate) => `linear-gradient(135deg, ${t.theme.from}, ${t.theme.to})`;

/** Cards linking to each split page. Server-safe: plain links, no hooks. */
export const TemplateGrid = ({ exclude }: { exclude?: string }) => (
	<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
		{TEMPLATES.filter((t) => t.id !== exclude).map((t) => (
			<li key={t.id} className="min-w-0">
				<Link
					href={`/split/${t.id}`}
					className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-card"
				>
					<span
						aria-hidden
						className="flex h-16 items-center justify-center text-3xl"
						style={{ background: themeGradient(t) }}
					>
						{t.emoji}
					</span>
					<span className="p-3">
						<span className="block text-sm font-semibold text-ink group-hover:text-brand-700">{t.label}</span>
						<span className="mt-0.5 block text-xs leading-snug text-ink-muted">{t.headline}</span>
					</span>
				</Link>
			</li>
		))}
	</ul>
);
