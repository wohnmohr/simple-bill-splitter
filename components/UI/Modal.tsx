import { ReactNode } from "react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	className?: string;
}

export const Modal = ({
	isOpen,
	onClose,
	children,
	className = "",
}: ModalProps) => {
	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
			onClick={onClose}
		>
			<div
				className={`bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-sm w-full max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden ${className}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div
					className="overflow-y-auto overscroll-contain"
					style={{ height: "100%", maxHeight: "inherit" }}
				>
					{children}
				</div>
			</div>
		</div>
	);
};
