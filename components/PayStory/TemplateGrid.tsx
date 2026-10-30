import Link from "next/link";
import { TEMPLATES, type SplitTemplate } from "@/utils/payStory";

export const themeGradient = (t: SplitTemplate) => `linear-gradient(135deg, ${t.theme.from}, ${t.theme.to})`;

/**
 * Cards linking to each split page. Server-safe: plain links, no hooks.
 * Plain cards in the site's own look; each template's colours start on its own page.
 */
export const TemplateGrid = ({ exclude }: { exclude?: string }) => (
	<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
		{TEMPLATES.filter((t) => t.id !== exclude).map((t) => (
			<li key={t.id} className="min-w-0">
				<Link
					href={`/split/${t.id}`}
					className="group flex h-full flex-col rounded-xl border border-line bg-surface transition-colors hover:border-line-strong"
				>
					<span className="p-4">
						<span className="block text-sm font-semibold text-ink group-hover:text-brand-700">{t.label}</span>
						<span className="mt-0.5 block text-xs leading-snug text-ink-muted">{t.headline}</span>
					</span>
				</Link>
			</li>
		))}
	</ul>
);
