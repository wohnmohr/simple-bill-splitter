"use client";

import { ReactNode } from "react";
import { Modal as MantineModal } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

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
	const isMobile = useMediaQuery("(max-width: 768px)", true, {
		getInitialValueInEffect: false,
	});
	return (
		<MantineModal
			opened={isOpen}
			onClose={onClose}
			centered
			overlayProps={{
				backgroundOpacity: 0.5,
				blur: 4,
			}}
			radius={isMobile ? 0 : "md"}
			size={isMobile ? "100%" : "sm"}
			fullScreen={isMobile}
			classNames={{
				content: className,
			}}
		>
			{children}
		</MantineModal>
	);
};
