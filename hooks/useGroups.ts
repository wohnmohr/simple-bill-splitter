import { useState, useEffect, useRef } from "react";
import { Group, Currency } from "@/types";
import { MAX_GROUPS, CURRENCIES } from "@/constants";
import { loadGroupsFromStorage, saveGroupsToStorage } from "@/utils/storage";
import { consumePendingGroupSelection } from "@/utils/shareImport";

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Load groups from localStorage on mount
  useEffect(() => {
    const loadedGroups = loadGroupsFromStorage();
    setGroups(loadedGroups);
    hasLoadedRef.current = true;
    const pendingId = consumePendingGroupSelection();
    if (pendingId && loadedGroups.some((g) => g.id === pendingId)) {
      setSelectedGroupId(pendingId);
    }
  }, []);

  // Save groups to localStorage whenever groups change (after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      saveGroupsToStorage(groups);
    }
  }, [groups]);

  const createGroup = (name: string, currency: Currency = CURRENCIES[0]): boolean => {
    if (!name.trim() || groups.length >= MAX_GROUPS) {
      return false;
    }

    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: name.trim(),
      members: [],
      expenses: [],
      currency,
    };

    setGroups([...groups, newGroup]);
    setSelectedGroupId(newGroup.id);
    return true;
  };

  const deleteGroup = (groupId: string): void => {
    const updatedGroups = groups.filter((g) => g.id !== groupId);
    setGroups(updatedGroups);
    if (selectedGroupId === groupId) {
      setSelectedGroupId(updatedGroups.length > 0 ? updatedGroups[0].id : null);
    }
  };

  const updateGroupCurrency = (groupId: string, currency: Currency): void => {
    const updatedGroups = groups.map((g) =>
      g.id === groupId ? { ...g, currency } : g
    );
    setGroups(updatedGroups);
  };

  const currentGroup = groups.find((g) => g.id === selectedGroupId);

  return {
    groups,
    selectedGroupId,
    setSelectedGroupId,
    currentGroup,
    createGroup,
    deleteGroup,
    updateGroupCurrency,
    setGroups,
  };
};

