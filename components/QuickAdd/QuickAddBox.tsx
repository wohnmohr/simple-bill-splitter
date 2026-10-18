import { useRef, useState, type CSSProperties } from "react";
import { SendHorizontal, Sparkles } from "lucide-react";
import { quickAddTemplates, suggestQuickAdd } from "@/utils/quickAddSuggest";

interface QuickAddBoxProps {
	onSubmit: (text: string) => void;
	label: string;
	/** The group's members, offered as names while typing. */
	memberNames?: string[];
	/** Starting sentences only once the box is focused, where space is tight (an open group). */
	compact?: boolean;
}

/** Type an expense like a message; the preview that follows does the rest. */
export const QuickAddBox = ({ onSubmit, label, memberNames = [], compact = false }: QuickAddBoxProps) => {
	const [text, setText] = useState("");
	const [focused, setFocused] = useState(false);
	const input = useRef<HTMLTextAreaElement>(null);
	const submit = () => text.trim() && onSubmit(text.trim());
	const templates = quickAddTemplates(memberNames);
	// Empty: whole sentences to start from. Typing: what usually comes next.
	const chips = !text ? (compact && !focused ? [] : templates) : focused ? suggestQuickAdd(text, memberNames) : [];

	const apply = (next: string) => {
		setText(next);
		input.current?.focus();
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			{chips.length > 0 && (
				// One swipeable row above the bar, like quick replies in a chat.
				<div className="mb-2 flex gap-1.5 overflow-x-auto [scrollbar-width:none]" aria-label={text ? "Suggestions" : "Start from"}>
					{chips.map((s) => (
						<button
							key={s.label}
							type="button"
							title={s.text}
							// Keep the keyboard open: act before the textarea loses focus.
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => apply(s.text)}
							className="min-h-8 shrink-0 rounded-full border border-line-strong bg-surface px-3 text-sm font-medium text-ink-soft hover:bg-paper"
						>
							{s.label}
						</button>
					))}
				</div>
			)}
			<div className="flex items-end gap-2">
				<div className="flex min-h-11 flex-1 items-end gap-2 rounded-3xl border border-line bg-surface py-1 pl-4 pr-3 shadow-card focus-within:border-brand-300">
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
						placeholder="Type an expense"
						enterKeyHint="send"
						rows={1}
						maxLength={1000}
						// Grows with what is typed, where browsers support it.
						style={{ fieldSizing: "content" } as CSSProperties}
						className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[15px] text-ink outline-none placeholder:text-ink-muted"
					/>
				</div>
				<button type="submit" disabled={!text.trim()} className="btn-primary !h-11 !w-11 shrink-0 !rounded-full !p-0" aria-label="Preview">
					<SendHorizontal className="h-5 w-5" />
				</button>
			</div>
		</form>
	);
};
