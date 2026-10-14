"use client";

import { useEffect, useState } from "react";
import { TextInput } from "@mantine/core";
import { Dices, Lock } from "lucide-react";
import { Modal } from "@/components/UI/Modal";
import { MemberAvatar } from "@/components/Group/MemberAvatar";
import type { Group, Person } from "@/types";
import { newIdentity, shownMembers } from "@/utils/identity";
import { newId } from "@/utils/ids";

type Props = {
	isOpen: boolean;
	group: Group;
	/** Join as a new member with this name and id (pre-made, so the preview's colour is theirs). */
	onJoin: (name: string, id: string) => void;
	/** "That's me": an existing member. */
	onClaim: (personId: string) => void;
	/** "Just looking": no identity in this group. */
	onJustLooking: () => void;
	onClose: () => void;
};

/**
 * Who you are in a group. Joining suggests an anonymous, made-up name so
 * nobody has to give their real one; it's end-to-end encrypted with the group
 * either way, and can be changed later.
 */
export const IdentitySheet = ({ isOpen, group, onJoin, onClaim, onJustLooking, onClose }: Props) => {
	const suggest = () => ({ ...newIdentity(group.members), id: newId("person") });
	const [identity, setIdentity] = useState(suggest);
	const [name, setName] = useState(identity.name);
	const shuffle = () => {
		const next = suggest();
		setIdentity(next);
		setName(next.name);
	};
	// A fresh suggestion each time the sheet opens.
	useEffect(() => {
		if (isOpen) shuffle();
	}, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

	const members = shownMembers(group);
	const trimmed = name.trim();
	// Typing a name the group already has is most likely the same person on a new device.
	const clash = trimmed
		? group.members.find((m, i) => [m.name, members[i].name].some((n) => n.trim().toLowerCase() === trimmed.toLowerCase()))
		: undefined;
	const notJoined = members.filter((m) => !m.joined);
	const joined = members.filter((m) => m.joined);

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={`Who are you in ${group.name}?`}>
			<div className="space-y-5 pb-2">
				<form
					className="rounded-2xl border border-line bg-paper p-4"
					onSubmit={(e) => {
						e.preventDefault();
						if (trimmed && !clash) onJoin(trimmed, identity.id);
					}}
				>
					<div className="flex items-center gap-3">
						<MemberAvatar person={{ id: identity.id, name: name || identity.name }} size="lg" />
						<div className="min-w-0 flex-1">
							<TextInput
								aria-label="Your name in this group"
								value={name}
								onChange={(e) => setName(e.target.value)}
								maxLength={40}
								data-autofocus
							/>
						</div>
						<button type="button" onClick={shuffle} className="icon-btn" aria-label="Suggest another anonymous name">
							<Dices className="h-5 w-5" />
						</button>
					</div>
					<p className="mt-3 flex items-start gap-2 text-sm text-ink-muted">
						<Lock className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
						<span>
							Only people in this group see this name; it&apos;s end-to-end encrypted. Keep the anonymous one or use any
							name, and change it any time.
						</span>
					</p>
					{clash ? (
						<div role="alert" className="mt-4 rounded-xl bg-brand-50 p-3">
							<p className="text-sm font-medium text-brand-900">
								“{clash.name}” is already in this group. If that&apos;s you on another device, use it here; otherwise pick
								another name.
							</p>
							<div className="mt-2 flex gap-2">
								<button type="button" onClick={() => onClaim(clash.id)} className="btn-primary !py-2">
									That&apos;s me
								</button>
								<button type="button" onClick={shuffle} className="btn-ghost">
									Another name
								</button>
							</div>
						</div>
					) : (
						<button type="submit" disabled={!trimmed} className="btn-primary mt-4 w-full">
							Join as {trimmed || "…"}
						</button>
					)}
				</form>

				{members.length > 0 && (
					<div className="space-y-3">
						<p className="label-text">Already in the group?</p>
						{notJoined.length > 0 && <MemberChips label="Not joined yet" people={notJoined} onClaim={onClaim} />}
						{joined.length > 0 && <MemberChips label="Joined on a device" people={joined} onClaim={onClaim} />}
						<p className="text-xs text-ink-muted">
							Joined on another phone? Pick your name, or open your personal link from Share &amp; sync on that phone,
							so you don&apos;t join twice.
						</p>
					</div>
				)}

				<button type="button" onClick={onJustLooking} className="btn-ghost w-full">
					Just looking
				</button>
			</div>
		</Modal>
	);
};

const MemberChips = ({ label, people, onClaim }: { label: string; people: Person[]; onClaim: (id: string) => void }) => (
	<div>
		<p className="mb-1.5 text-xs font-medium text-ink-muted">{label}</p>
		<div className="flex flex-wrap gap-2">
			{people.map((m) => (
				<button
					key={m.id}
					type="button"
					onClick={() => onClaim(m.id)}
					className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface py-1 pl-1 pr-4 text-sm font-medium text-ink hover:border-brand-400 hover:bg-brand-50"
				>
					<MemberAvatar person={m} size="sm" />
					I&apos;m {m.name}
				</button>
			))}
		</div>
	</div>
);
