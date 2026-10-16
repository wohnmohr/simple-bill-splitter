import { Person } from "@/types";
import { Group } from "@/types";
import { newId } from "@/utils/ids";
import { expensePayers } from "@/utils/calculations";

export const useGroupMembers = (
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>,
  currentGroup: Group | undefined
) => {
  const updateCurrent = (change: (g: Group) => Group) => {
    if (!currentGroup) return;
    setGroups((prev) => prev.map((g) => (g.id === currentGroup.id ? change(g) : g)));
  };

  const updateMember = (personId: string, change: (m: Person) => Person) =>
    updateCurrent((g) => ({ ...g, members: g.members.map((m) => (m.id === personId ? change(m) : m)) }));

  /**
   * Adds a member and returns their id, or null if there's no name or group.
   * Someone joining passes their pre-made id and is marked as joined.
   */
  const addMember = (name: string, upiId?: string, joiner?: { id: string }): string | null => {
    if (!name.trim() || !currentGroup) {
      return null;
    }

    const newPerson: Person = {
      id: joiner?.id ?? newId("person"),
      name: name.trim(),
      ...(upiId?.trim() ? { upiId: upiId.trim() } : {}),
      ...(joiner ? { joined: true as const } : {}),
    };

    updateCurrent((g) => ({ ...g, members: [...g.members, newPerson] }));
    return newPerson.id;
  };

  const updateMemberUpi = (personId: string, upiId: string): void => {
    const trimmed = upiId.trim();
    updateMember(personId, ({ upiId: _old, ...rest }) => (trimmed ? { ...rest, upiId: trimmed } : rest));
  };

  /** Marks that someone has joined as this member from a device. */
  const markJoined = (personId: string): void => updateMember(personId, (m) => (m.joined ? m : { ...m, joined: true }));

  /** Renames a member for everyone in the group. */
  const renameMember = (personId: string, name: string): void => {
    const trimmed = name.trim();
    if (trimmed) updateMember(personId, (m) => ({ ...m, name: trimmed.slice(0, 40) }));
  };

  /** Sets (or, when empty, clears) the nickname this device shows for a member. Never synced. */
  const setNickname = (personId: string, nickname: string): void => {
    const trimmed = nickname.trim().slice(0, 40);
    updateCurrent((g) => {
      const { [personId]: _old, ...rest } = g.nicknames ?? {};
      const nicknames = trimmed ? { ...rest, [personId]: trimmed } : rest;
      const { nicknames: _prev, ...group } = g;
      return Object.keys(nicknames).length ? { ...group, nicknames } : group;
    });
  };

  const deleteMember = (personId: string): void => {
    updateCurrent((g) => ({
      ...g,
      members: g.members.filter((p) => p.id !== personId),
      expenses: g.expenses.filter(
        (e) => !expensePayers(e).has(personId) && !e.participants.includes(personId)
      ),
    }));
  };

  return {
    addMember,
    updateMemberUpi,
    renameMember,
    markJoined,
    setNickname,
    deleteMember,
  };
};
