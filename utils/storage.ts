import type { Group } from "@/types";
import { STORAGE_KEY } from "@/constants";
import { trackStorageFailure } from "@/lib/analytics";

/** The least the app needs to show a group; a hand-edited or half-written entry is skipped rather than crashing every screen. */
const usable = (g: unknown): g is Group => {
  const x = g as Partial<Group> | null;
  return !!x && typeof x.id === "string" && Array.isArray(x.members) && Array.isArray(x.expenses);
};

export const loadGroupsFromStorage = (): Group[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const groups: unknown = JSON.parse(stored);
      return Array.isArray(groups) ? groups.filter(usable) : [];
    }
  } catch (e) {
    console.error("Failed to load groups from storage", e);
  }
  return [];
};

export const saveGroupsToStorage = (groups: Group[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (e) {
    console.error("Failed to save groups to storage", e);
    trackStorageFailure("groups", e);
  }
};

