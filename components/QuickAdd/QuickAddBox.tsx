import { useState, type CSSProperties } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

interface QuickAddBoxProps {
	onSubmit: (text: string) => void;
	placeholder: string;
	label: string;
}

/** Type an expense like a message; the preview that follows does the rest. */
export const QuickAddBox = ({ onSubmit, placeholder, label }: QuickAddBoxProps) => {
	const [text, setText] = useState("");
	const submit = () => text.trim() && onSubmit(text.trim());

	return (
		<form
			className="surface flex items-end gap-2 p-2 pl-3"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<Sparkles className="mb-2.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
			<textarea
				aria-label={label}
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={(e) => {
					// Enter previews; Shift+Enter starts a new line for another expense.
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						submit();
					}
				}}
				placeholder={placeholder}
				rows={1}
				maxLength={1000}
				// Grows with what is typed, where browsers support it.
				style={{ fieldSizing: "content" } as CSSProperties}
				className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[15px] text-ink outline-none placeholder:text-ink-muted"
			/>
			<button type="submit" disabled={!text.trim()} className="btn-primary !h-9 !w-9 shrink-0 !p-0" aria-label="Preview">
				<ArrowUp className="h-4 w-4" />
			</button>
		</form>
	);
};
