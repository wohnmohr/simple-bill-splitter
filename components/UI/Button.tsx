import { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as MantineButton } from "@mantine/core";

interface ButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
	variant?: "primary" | "secondary" | "danger";
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	children: ReactNode;
	leftSection?: ReactNode;
}

export const Button = ({
	variant = "primary",
	size = "md",
	children,
	className = "",
	...props
}: ButtonProps) => {
	const mantineVariant =
		variant === "primary" ? "filled" : variant === "secondary" ? "default" : "light";

	const mantineColor = variant === "danger" ? "red" : "brand";

	return (
		<MantineButton
			variant={mantineVariant}
			color={mantineColor}
			size={size}
			radius="md"
			className={`${className} !font-semibold`}
			{...props}
		>
			{children}
		</MantineButton>
	);
};
