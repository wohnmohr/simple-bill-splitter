import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "danger";
	children: ReactNode;
}

export const Button = ({
	variant = "primary",
	children,
	className = "",
	...props
}: ButtonProps) => {
	const baseClasses =
		"px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 text-sm sm:text-base touch-manipulation";

	const variantClasses = {
		primary:
			"bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 focus:ring-indigo-500 shadow-lg shadow-indigo-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none",
		secondary:
			"bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-400",
		danger:
			"bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-lg shadow-red-200",
	};

	return (
		<button
			className={`${baseClasses} ${variantClasses[variant]} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
};
