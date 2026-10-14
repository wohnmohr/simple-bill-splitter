import { Person } from "@/types";
import { Group } from "@/types";
import { newId } from "@/utils/ids";

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

  /** Adds a member and returns their id, or null if there's no name or group. */
  const addMember = (name: string, upiId?: string, avatar?: string): string | null => {
    if (!name.trim() || !currentGroup) {
      return null;
    }

    const newPerson: Person = {
      id: newId("person"),
      name: name.trim(),
      ...(upiId?.trim() ? { upiId: upiId.trim() } : {}),
      ...(avatar ? { avatar } : {}),
    };

    updateCurrent((g) => ({ ...g, members: [...g.members, newPerson] }));
    return newPerson.id;
  };

  const updateMemberUpi = (personId: string, upiId: string): void => {
    const trimmed = upiId.trim();
    updateMember(personId, ({ upiId: _old, ...rest }) => (trimmed ? { ...rest, upiId: trimmed } : rest));
  };

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
        (e) => e.paidBy !== personId && !e.participants.includes(personId)
      ),
    }));
  };

  return {
    addMember,
    updateMemberUpi,
    renameMember,
    setNickname,
    deleteMember,
  };
};
