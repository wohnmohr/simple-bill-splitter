import React from "react";
import { TextInput } from "@mantine/core";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/UI/Modal";
import { MemberAvatar } from "@/components/Group/MemberAvatar";
import { Group, Person } from "@/types";
import { isValidUpiId } from "@/utils/upi";

interface AddMembersModalProps {
	isOpen: boolean;
	onClose: () => void;
	group: Group;
	onAddMember: (name: string, upiId?: string) => void;
	onUpdateMemberUpi?: (personId: string, upiId: string) => void;
	/** Renames a member for everyone. */
	onRenameMember: (personId: string, name: string) => void;
	/** Sets the nickname only this device shows (empty clears it). */
	onSetNickname: (personId: string, nickname: string) => void;
	onDeleteMember: (personId: string) => void;
}

/**
 * Who's in the group. In a shared group you rename yourself for everyone and
 * give others nicknames only you see; in a group on this device alone, a
 * rename is just a rename.
 */
export const AddMembersModal = ({
	isOpen,
	onClose,
	group,
	onAddMember,
	onUpdateMemberUpi,
	onRenameMember,
	onSetNickname,
	onDeleteMember,
}: AddMembersModalProps) => {
	const [memberName, setMemberName] = React.useState("");
	const [memberUpi, setMemberUpi] = React.useState("");
	const [editing, setEditing] = React.useState<{ id: string; value: string } | null>(null);
	const nameRef = React.useRef<HTMLInputElement>(null);
	const shared = !!group.sync;
	/** Whose name the pencil changes for everyone; for anyone else in a shared group it's a private nickname. */
	const renamesForEveryone = (m: Person) => !shared || m.id === group.meId;
	const saveEdit = (m: Person) => {
		if (!editing) return;
		if (renamesForEveryone(m)) onRenameMember(m.id, editing.value);
		else onSetNickname(m.id, editing.value === m.name ? "" : editing.value);
		setEditing(null);
	};

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
		setEditing(null);
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
						placeholder={group.members.length === 0 ? "Your name" : "Name"}
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
							Start with yourself, then everyone who shares expenses.
						</p>
					) : (
						<ul className="divide-y divide-line rounded-xl border border-line">
							{group.members.map((member: Person) => {
								const nickname = group.nicknames?.[member.id];
								const isMe = member.id === group.meId;
								const forEveryone = renamesForEveryone(member);
								const isEditing = editing?.id === member.id;
								return (
								<li key={member.id} className="px-3.5 py-3 space-y-2">
									<div className="flex items-center gap-3">
										<MemberAvatar person={member} />
										{isEditing ? (
											<form
												className="flex min-w-0 flex-1 gap-2"
												onSubmit={(e) => {
													e.preventDefault();
													saveEdit(member);
												}}
											>
												<TextInput
													className="min-w-0 flex-1"
													aria-label={forEveryone ? `New name for ${member.name}` : `Nickname for ${member.name}`}
													value={editing.value}
													onChange={(e) => setEditing({ id: member.id, value: e.target.value })}
													placeholder={forEveryone ? "Name" : member.name}
													maxLength={40}
													size="sm"
													styles={{ input: { minHeight: 38, fontSize: 15 } }}
													data-autofocus
													autoFocus
												/>
												<button type="submit" className="btn-primary !px-3 !py-2" disabled={forEveryone && !editing.value.trim()}>
													Save
												</button>
											</form>
										) : (
											<span className="min-w-0 flex-1">
												<span className="flex items-center gap-2">
													<span className="truncate font-medium text-ink">{nickname || member.name}</span>
													{isMe && (
														<span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">You</span>
													)}
												</span>
												{nickname && (
													<span className="block truncate text-xs text-ink-muted">Others see “{member.name}”</span>
												)}
											</span>
										)}
										{!isEditing && (
											<button
												type="button"
												onClick={() => setEditing({ id: member.id, value: forEveryone ? member.name : nickname || "" })}
												className="icon-btn !h-8 !w-8"
												aria-label={isMe ? "Change your name" : forEveryone ? `Rename ${member.name}` : `Nickname for ${member.name}`}
											>
												<Pencil className="h-4 w-4" />
											</button>
										)}
										<button
											type="button"
											onClick={() => onDeleteMember(member.id)}
											className="icon-btn !h-8 !w-8 hover:!text-negative"
											aria-label={`Remove ${member.name}`}
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
									{isEditing && (
										<p className="text-xs text-ink-muted">
											{isMe && shared
												? "Everyone in the group sees this name. It stays end-to-end encrypted."
												: forEveryone
													? "This is the name in the group and in share links."
													: `Only on this device. The group still sees “${member.name}”. Leave it empty to use that.`}
										</p>
									)}
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
								);
							})}
						</ul>
					)}
					{isInr && group.members.length > 0 && (
						<p className="mt-2 text-xs text-ink-muted">
							{shared
								? "Names and UPI IDs are shared with the group, end-to-end encrypted."
								: "UPI IDs stay on this device and travel only inside encrypted share links."}
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
