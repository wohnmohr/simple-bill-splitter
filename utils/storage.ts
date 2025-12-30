import { Group } from "@/types";
import { STORAGE_KEY } from "@/constants";

export const loadGroupsFromStorage = (): Group[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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
  }
};

