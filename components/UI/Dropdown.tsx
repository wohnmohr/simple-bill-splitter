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
	label?: string;
}

export const Dropdown = ({
	value,
	onChange,
	options,
	placeholder = "Select an option",
	className = "",
	label,
}: DropdownProps) => {
	return (
		<Select
			label={label}
			value={value || null}
			onChange={(val) => onChange(val || "")}
			data={options.filter((o) => o.value !== "")}
			placeholder={placeholder}
			className={className}
			allowDeselect={false}
			checkIconPosition="right"
			radius="md"
		/>
	);
};
