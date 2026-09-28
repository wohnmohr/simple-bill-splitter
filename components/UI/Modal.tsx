"use client";

import { ReactNode } from "react";
import { Modal as MantineModal } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	className?: string;
	title?: ReactNode;
}

export const Modal = ({
	isOpen,
	onClose,
	children,
	className = "",
	title,
}: ModalProps) => {
	const isMobile = useMediaQuery("(max-width: 640px)", true, {
		getInitialValueInEffect: false,
	});
	return (
		<MantineModal
			opened={isOpen}
			onClose={onClose}
			centered
			title={title}
			radius={isMobile ? 0 : "lg"}
			size={isMobile ? "100%" : 440}
			fullScreen={isMobile}
			closeButtonProps={{ "aria-label": "Close" }}
			transitionProps={{ transition: isMobile ? "slide-up" : "pop", duration: 180 }}
			classNames={{
				content: className,
				title: "!font-display !text-xl !font-semibold !text-ink",
				header: "!pb-1",
			}}
		>
			{children}
		</MantineModal>
	);
};
