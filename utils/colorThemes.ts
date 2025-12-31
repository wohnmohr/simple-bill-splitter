export type ColorTheme = {
  gradient: string;
  border: string;
};

// Predefined color themes that work well with the gradient background
const colorThemes: ColorTheme[] = [
  {
    gradient: "from-indigo-500 to-indigo-600",
    border: "border-indigo-200",
  },
  {
    gradient: "from-purple-500 to-purple-600",
    border: "border-purple-200",
  },
  {
    gradient: "from-pink-500 to-pink-600",
    border: "border-pink-200",
  },
  {
    gradient: "from-indigo-400 to-purple-500",
    border: "border-indigo-200",
  },
  {
    gradient: "from-cyan-500 to-cyan-600",
    border: "border-cyan-200",
  },
  {
    gradient: "from-teal-500 to-teal-600",
    border: "border-teal-200",
  },
  {
    gradient: "from-emerald-500 to-emerald-600",
    border: "border-emerald-200",
  },
  {
    gradient: "from-amber-500 to-amber-600",
    border: "border-amber-200",
  },
];

/**
 * Get a consistent color theme for a group based on its ID
 */
export const getGroupColorTheme = (groupId: string): ColorTheme => {
  // Simple hash function to convert group ID to an index
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) {
    hash = ((hash << 5) - hash + groupId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % colorThemes.length;
  return colorThemes[index];
};

