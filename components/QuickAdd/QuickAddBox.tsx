import { useRef, useState, type CSSProperties } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { quickAddTemplates, suggestQuickAdd } from "@/utils/quickAddSuggest";

interface QuickAddBoxProps {
	onSubmit: (text: string) => void;
	label: string;
	/** The group's members, offered as names while typing. */
	memberNames?: string[];
}

/** Type an expense like a message; the preview that follows does the rest. */
export const QuickAddBox = ({ onSubmit, label, memberNames = [] }: QuickAddBoxProps) => {
	const [text, setText] = useState("");
	const [focused, setFocused] = useState(false);
	const input = useRef<HTMLTextAreaElement>(null);
	const submit = () => text.trim() && onSubmit(text.trim());
	const templates = quickAddTemplates(memberNames);
	// Empty: whole sentences to start from. Typing: what usually comes next.
	const chips = !text ? templates : focused ? suggestQuickAdd(text, memberNames) : [];

	const apply = (next: string) => {
		setText(next);
		input.current?.focus();
	};

	return (
		<form
			className="surface p-2 pl-3"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<div className="flex items-end gap-2">
				<Sparkles className="mb-2.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
				<textarea
					ref={input}
					aria-label={label}
					value={text}
					onChange={(e) => setText(e.target.value)}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					onKeyDown={(e) => {
						// Enter previews; Shift+Enter starts a new line for another expense; Tab takes the first suggestion.
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							submit();
						} else if (e.key === "Tab" && !e.shiftKey && text && chips.length) {
							e.preventDefault();
							apply(chips[0].text);
						}
					}}
					placeholder={templates[0].text}
					rows={1}
					maxLength={1000}
					// Grows with what is typed, where browsers support it.
					style={{ fieldSizing: "content" } as CSSProperties}
					className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[15px] text-ink outline-none placeholder:text-ink-muted"
				/>
				<button type="submit" disabled={!text.trim()} className="btn-primary !h-9 !w-9 shrink-0 !p-0" aria-label="Preview">
					<ArrowUp className="h-4 w-4" />
				</button>
			</div>
			{chips.length > 0 && (
				<div className="mt-1.5 flex flex-wrap gap-1.5 pl-6" aria-label={text ? "Suggestions" : "Start from"}>
					{chips.map((s) => (
						<button
							key={s.label}
							type="button"
							title={s.text}
							// Keep the keyboard open: act before the textarea loses focus.
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => apply(s.text)}
							className="min-h-8 rounded-full border border-line-strong px-3 text-sm font-medium text-ink-soft hover:bg-paper"
						>
							{s.label}
						</button>
					))}
				</div>
			)}
		</form>
	);
};
