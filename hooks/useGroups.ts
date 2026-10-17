import { useState, useEffect, useRef } from "react";
import { Group, Currency } from "@/types";
import { MAX_GROUPS, DEFAULT_CURRENCY } from "@/constants";
import { loadGroupsFromStorage, saveGroupsToStorage } from "@/utils/storage";
import { consumePendingGroupSelection } from "@/utils/shareImport";
import { useGroupSync } from "@/hooks/useGroupSync";
import { useBackup } from "@/hooks/useBackup";
import { disableAlerts } from "@/utils/groupAlerts";
import { newId } from "@/utils/ids";
import { addDueRepeats } from "@/utils/recurring";

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  // Load groups from localStorage on mount
  useEffect(() => {
    const loadedGroups = loadGroupsFromStorage();
    setGroups(loadedGroups);
    hasLoadedRef.current = true;
    setLoaded(true);
    const pendingId = consumePendingGroupSelection();
    if (pendingId && loadedGroups.some((g) => g.id === pendingId)) {
      setSelectedGroupId(pendingId);
    }
  }, []);

  // Synced groups: every change below is picked up and sent, encrypted.
  const sync = useGroupSync(groups, setGroups, selectedGroupId);
  // Opt-in: once turned on, every change is backed up too, encrypted.
  const backup = useBackup(groups, loaded);

  // Save groups to localStorage whenever groups change (after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      saveGroupsToStorage(groups);
    }
  }, [groups]);

  // Monthly expenses that have come due: on load, on every change, and when the app comes back to the front.
  const [awake, setAwake] = useState(0);
  useEffect(() => {
    const onShow = () => document.visibilityState === "visible" && setAwake((n) => n + 1);
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, []);
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const now = Date.now();
    let due = false;
    const next = groups.map((g) => {
      // A closed group is finished: its monthly expenses stop.
      if (g.closedAt) return g;
      const expenses = addDueRepeats(g.expenses, now);
      if (expenses === g.expenses) return g;
      due = true;
      return { ...g, expenses };
    });
    if (due) setGroups(next);
  }, [groups, awake]);

  /** Creates and opens a group; `fill` adds its first members and expenses (quick add). */
  const createGroup = (
    name: string,
    currency: Currency = DEFAULT_CURRENCY,
    fill: (g: Group) => Group = (g) => g
  ): boolean => {
    if (!name.trim() || groups.length >= MAX_GROUPS) {
      return false;
    }

    const newGroup: Group = fill({
      id: newId("group"),
      name: name.trim(),
      members: [],
      expenses: [],
      currency,
    });

    setGroups([...groups, newGroup]);
    setSelectedGroupId(newGroup.id);
    return true;
  };

  /** Removes a group from this device. A synced group stays on the server for everyone else. */
  const deleteGroup = (groupId: string): void => {
    sync.forgetGroup(groupId);
    // No more alerts for a group this device no longer has.
    const removed = groups.find((g) => g.id === groupId);
    if (removed) disableAlerts(removed).catch(() => undefined);
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

  /** Sets a group's theme; for a synced group everyone sees it. */
  const setGroupTheme = (groupId: string, theme: string | undefined): void => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, theme } : g)));
  };

  /** Closes a finished group for everyone, or reopens it (undefined). */
  const setGroupClosed = (groupId: string, closedAt: number | undefined): void => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, closedAt } : g)));
  };

  const setGroupMe = (groupId: string, meId: string | null | undefined): void => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, meId } : g)));
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
    setGroupMe,
    setGroupTheme,
    setGroupClosed,
    setGroups,
    sync,
    backup,
  };
};

