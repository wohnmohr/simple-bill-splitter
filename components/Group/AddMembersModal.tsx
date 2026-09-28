import React from "react";
import { TextInput } from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/UI/Modal";
import { Group, Person } from "@/types";
import { isValidUpiId } from "@/utils/upi";

interface AddMembersModalProps {
	isOpen: boolean;
	onClose: () => void;
	group: Group;
	onAddMember: (name: string, upiId?: string) => void;
	onUpdateMemberUpi?: (personId: string, upiId: string) => void;
	onDeleteMember: (personId: string) => void;
}

export const AddMembersModal = ({
	isOpen,
	onClose,
	group,
	onAddMember,
	onUpdateMemberUpi,
	onDeleteMember,
}: AddMembersModalProps) => {
	const [memberName, setMemberName] = React.useState("");
	const [memberUpi, setMemberUpi] = React.useState("");
	const nameRef = React.useRef<HTMLInputElement>(null);

	const handleSubmit = () => {
		if (memberName.trim() && !upiError(memberUpi)) {
			onAddMember(memberName.trim(), memberUpi.trim() || undefined);
			setMemberName("");
			setMemberUpi("");
			// Keep the flow fast: ready for the next name.
			nameRef.current?.focus();
		}
	};

	const handleClose = () => {
		setMemberName("");
		setMemberUpi("");
		onClose();
	};

	const isInr = group.currency.code === "INR";
	// Same rule as Settle up: a UPI ID is handle@bank.
	const upiError = (value: string) =>
		value.trim() && !isValidUpiId(value)
			? "UPI IDs look like name@okaxis"
			: undefined;
	const newUpiError = upiError(memberUpi);

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Members">
			<div className="flex flex-col gap-5 pb-2">
				<form
					className="rounded-xl border border-line bg-paper p-3 space-y-2"
					onSubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<TextInput
						ref={nameRef}
						aria-label="Name"
						value={memberName}
						onChange={(e) => setMemberName(e.target.value)}
						placeholder="Name"
						data-autofocus
						maxLength={40}
					/>
					{isInr && (
						<TextInput
							aria-label="UPI ID (optional)"
							value={memberUpi}
							onChange={(e) => setMemberUpi(e.target.value)}
							placeholder="UPI ID, e.g. priya@okaxis (optional)"
							error={newUpiError}
							autoCapitalize="none"
							spellCheck={false}
							data-ph-mask
						/>
					)}
					<button
						type="submit"
						disabled={!memberName.trim() || !!newUpiError}
						className="btn-primary w-full"
					>
						<Plus className="h-4 w-4" />
						Add member
					</button>
				</form>

				<div>
					<p className="label-text mb-2">
						{group.members.length === 0
							? "No one yet"
							: `${group.members.length} in ${group.name}`}
					</p>
					{group.members.length === 0 ? (
						<p className="text-sm text-ink-muted">
							Add everyone who shares expenses — including yourself.
						</p>
					) : (
						<ul className="divide-y divide-line rounded-xl border border-line">
							{group.members.map((member: Person) => (
								<li key={member.id} className="px-3.5 py-3 space-y-2">
									<div className="flex items-center justify-between gap-2">
										<span className="truncate font-medium text-ink">
											{member.name}
										</span>
										<button
											type="button"
											onClick={() => onDeleteMember(member.id)}
											className="icon-btn !h-8 !w-8 hover:!text-negative"
											aria-label={`Remove ${member.name}`}
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
									{isInr && onUpdateMemberUpi && (
										<TextInput
											aria-label={`${member.name}'s UPI ID`}
											value={member.upiId || ""}
											onChange={(e) =>
												onUpdateMemberUpi(member.id, e.target.value)
											}
											placeholder="Add UPI ID"
											error={upiError(member.upiId || "")}
											size="sm"
											autoCapitalize="none"
											spellCheck={false}
											styles={{ input: { minHeight: 38, fontSize: 15 } }}
											data-ph-mask
										/>
									)}
								</li>
							))}
						</ul>
					)}
					{isInr && group.members.length > 0 && (
						<p className="mt-2 text-xs text-ink-muted">
							UPI IDs stay on this device and travel only inside encrypted share
							links.
						</p>
					)}
				</div>

				<button type="button" onClick={handleClose} className="btn-secondary w-full">
					Done
				</button>
			</div>
		</Modal>
	);
};
