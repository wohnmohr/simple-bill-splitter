import { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as MantineButton } from "@mantine/core";

interface ButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
	variant?: "primary" | "secondary" | "danger";
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	children: ReactNode;
}

export const Button = ({
	variant = "primary",
	size = "md",
	children,
	className = "",
	...props
}: ButtonProps) => {
	const mantineVariant =
		variant === "primary"
			? "filled"
			: variant === "secondary"
			? "light"
			: "filled";

	const mantineColor =
		variant === "danger" ? "red" : variant === "secondary" ? "gray" : undefined;

	return (
		<MantineButton
			variant={mantineVariant}
			color={mantineColor}
			size={size}
			className={`${className} ${variant === "primary" ? "!text-white" : ""}`}
			style={
				variant === "primary"
					? {
							background: "linear-gradient(to right, #4f46e5, #9333ea)",
							color: "#ffffff",
							transition: "all 0.2s",
					  }
					: undefined
			}
			styles={
				variant === "primary"
					? {
							label: {
								color: "#ffffff",
							},
							root: {
								color: "#ffffff",
							},
					  }
					: undefined
			}
			{...props}
		>
			{children}
		</MantineButton>
	);
};
