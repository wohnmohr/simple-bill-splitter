import { Person } from "@/types";
import { Group } from "@/types";

export const useGroupMembers = (
  groups: Group[],
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>,
  currentGroup: Group | undefined
) => {
  const addMember = (name: string): boolean => {
    if (!name.trim() || !currentGroup) {
      return false;
    }

    const newPerson: Person = {
      id: `person-${Date.now()}`,
      name: name.trim(),
    };

    const updatedGroups = groups.map((g) =>
      g.id === currentGroup.id
        ? { ...g, members: [...g.members, newPerson] }
        : g
    );

    setGroups(updatedGroups);
    return true;
  };

  const deleteMember = (personId: string): void => {
    if (!currentGroup) return;

    const updatedGroups = groups.map((g) =>
      g.id === currentGroup.id
        ? {
          ...g,
          members: g.members.filter((p) => p.id !== personId),
          expenses: g.expenses.filter(
            (e) => e.paidBy !== personId && !e.participants.includes(personId)
          ),
        }
        : g
    );

    setGroups(updatedGroups);
  };

  return {
    addMember,
    deleteMember,
  };
};

