import React, { useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownOption {
	value: string;
	label: string;
}

interface DropdownProps {
	value: string;
	onChange: (value: string) => void;
	options: DropdownOption[];
	placeholder?: string;
	className?: string;
}

export const Dropdown = ({
	value,
	onChange,
	options,
	placeholder = "Select an option",
	className = "",
}: DropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [menuPosition, setMenuPosition] = useState({
		top: 0,
		left: 0,
		width: 0,
	});
	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);

	// Calculate menu position when opening
	useEffect(() => {
		if (isOpen && buttonRef.current) {
			const updatePosition = () => {
				if (buttonRef.current) {
					const rect = buttonRef.current.getBoundingClientRect();
					setMenuPosition({
						top: rect.bottom + 4, // 4px gap (mt-1 equivalent)
						left: rect.left,
						width: rect.width,
					});
				}
			};

			updatePosition();

			// Update position on scroll or resize
			window.addEventListener("scroll", updatePosition, true);
			window.addEventListener("resize", updatePosition);

			return () => {
				window.removeEventListener("scroll", updatePosition, true);
				window.removeEventListener("resize", updatePosition);
			};
		}
	}, [isOpen]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: Event) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			document.addEventListener("touchstart", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("touchstart", handleClickOutside);
		};
	}, [isOpen]);

	const handleSelect = (optionValue: string) => {
		onChange(optionValue);
		setIsOpen(false);
	};

	// Prevent scroll propagation to parent (modal)
	const handleScroll = (e: React.WheelEvent<HTMLDivElement>) => {
		e.stopPropagation();
	};

	const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
		e.stopPropagation();
	};

	return (
		<div className={`relative ${className}`} ref={dropdownRef}>
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-3.5 sm:px-4 sm:py-3 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-base text-left flex items-center justify-between cursor-pointer touch-manipulation hover:border-indigo-300 transition-colors"
			>
				<span
					className={`truncate flex-1 ${
						selectedOption ? "text-gray-800" : "text-gray-500"
					}`}
				>
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<ChevronDown
					className={`h-5 w-5 text-indigo-500 shrink-0 ml-2 transition-transform duration-200 ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{isOpen && (
				<div
					ref={menuRef}
					className="fixed z-[100] bg-white border-2 border-indigo-200 rounded-xl shadow-lg overflow-hidden"
					style={{
						top: `${menuPosition.top}px`,
						left: `${menuPosition.left}px`,
						width: `${menuPosition.width}px`,
						height: "240px",
					}}
					onWheel={handleScroll}
					onTouchMove={handleTouchMove}
				>
					<div
						className="overflow-y-auto overscroll-contain"
						style={{
							height: "100%",
							scrollBehavior: "smooth",
							touchAction: "pan-y",
						}}
						onWheel={handleScroll}
						onTouchMove={handleTouchMove}
					>
						{options
							.filter((option) => option.value !== "" || value === "")
							.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => handleSelect(option.value)}
									className={`w-full px-4 py-3 text-left text-base sm:text-base touch-manipulation transition-colors ${
										value === option.value
											? "bg-indigo-50 text-indigo-700 font-semibold"
											: "text-gray-700 hover:bg-indigo-50 active:bg-indigo-100"
									}`}
								>
									{option.label}
								</button>
							))}
					</div>
				</div>
			)}
		</div>
	);
};
