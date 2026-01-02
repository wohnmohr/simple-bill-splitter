import React from "react";
import { Select } from "@mantine/core";

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
	return (
		<Select
			value={value}
			onChange={(val) => onChange(val || "")}
			data={options}
			placeholder={placeholder}
			className={className}
			radius="md"
			styles={{
				input: {
					borderColor: "#c7d2fe",
					borderWidth: 2,
				},
			}}
		/>
	);
};
