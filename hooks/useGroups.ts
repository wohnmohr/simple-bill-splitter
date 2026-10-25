import { useState, useEffect } from "react";
import { Group, Currency } from "@/types";
import { MAX_GROUPS, DEFAULT_CURRENCY, STORAGE_KEY } from "@/constants";
import { loadGroupsFromStorage, saveGroupsToStorage } from "@/utils/storage";
import { consumePendingGroupSelection } from "@/utils/shareImport";
import { useGroupSync } from "@/hooks/useGroupSync";
import { useBackup } from "@/hooks/useBackup";
import { disableAlerts } from "@/utils/groupAlerts";
import { newId } from "@/utils/ids";
import { addDueRepeatsToGroups } from "@/utils/recurring";

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load groups from localStorage on mount
  useEffect(() => {
    const loadedGroups = loadGroupsFromStorage();
    setGroups(loadedGroups);
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
    if (loaded) {
      saveGroupsToStorage(groups);
    }
  }, [groups, loaded]);

  // Another tab or the installed app saved: show its groups, so this tab never saves an older copy over them.
  const { adopt } = sync;
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = loadGroupsFromStorage();
      adopt(next);
      setGroups(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [adopt]);

  // Monthly expenses that have come due: on load (a synced group once pulled), on every change, and when the app comes back to the front.
  const [awake, setAwake] = useState(0);
  useEffect(() => {
    const onShow = () => document.visibilityState === "visible" && setAwake((n) => n + 1);
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const next = addDueRepeatsToGroups(groups, sync.pulled);
    if (next !== groups) setGroups(next);
  }, [groups, awake, loaded, sync.pulled]);

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

  /** Renames a group; for a synced group everyone sees the new name. */
  const renameGroup = (groupId: string, name: string): void => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name } : g)));
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
    loaded,
    groups,
    selectedGroupId,
    setSelectedGroupId,
    currentGroup,
    createGroup,
    deleteGroup,
    updateGroupCurrency,
    renameGroup,
    setGroupMe,
    setGroupTheme,
    setGroupClosed,
    setGroups,
    sync,
    backup,
  };
};

