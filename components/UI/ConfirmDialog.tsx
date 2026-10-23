"use client";

import { Modal } from "@mantine/core";

export type ConfirmState = {
	title: string;
	detail?: string;
	action: string;
	onConfirm: () => void;
} | null;

interface ConfirmDialogProps {
	confirm: ConfirmState;
	onClose: () => void;
}

/** A small centered "are you sure?" for deletes, even on phones. */
export const ConfirmDialog = ({ confirm, onClose }: ConfirmDialogProps) => (
	<Modal
		opened={!!confirm}
		onClose={onClose}
		centered
		size="xs"
		radius="lg"
		withCloseButton={false}
		zIndex={300}
	>
		{confirm && (
			<div className="space-y-4">
				<div className="space-y-1">
					<h2 className="font-display text-lg font-semibold text-ink">{confirm.title}</h2>
					{confirm.detail && <p className="text-sm text-ink-soft">{confirm.detail}</p>}
				</div>
				<div className="grid grid-cols-2 gap-2">
					<button type="button" onClick={onClose} className="btn-secondary" data-autofocus>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => {
							confirm.onConfirm();
							onClose();
						}}
						className="btn-primary !bg-negative hover:!bg-negative/90"
					>
						{confirm.action}
					</button>
				</div>
			</div>
		)}
	</Modal>
);
