export const ALL = "All";

export type CategoryStyle = {
  /** Path of an icon in /public, or undefined to show the category's first letter. */
  icon?: string;
  /** Tile background, toned down against the card color in dark mode. */
  tile: string;
  /** Border and letter color. */
  accent: string;
};

const ICONS: Record<string, CategoryStyle> = {
  all: { icon: "/categories/all.webp", tile: "#ffe4ee", accent: "#ff4f8b" },
  lighting: { icon: "/categories/lighting.webp", tile: "#fff1d6", accent: "#f08a24" },
  figurine: { icon: "/categories/figurine.webp", tile: "#e1edff", accent: "#3b82f6" },
};

/** Category names in the database are free text, so several spellings share one icon. */
const ALIASES: Record<string, string> = {
  all: "all",
  light: "lighting",
  lights: "lighting",
  lighting: "lighting",
  lamp: "lighting",
  lamps: "lighting",
  figurine: "figurine",
  figurines: "figurine",
  figure: "figurine",
  figures: "figurine",
};

const FALLBACKS: CategoryStyle[] = [
  { tile: "#e3f4ec", accent: "#2f8f68" },
  { tile: "#ece8ff", accent: "#6d5bd0" },
  { tile: "#ffe7df", accent: "#e0613a" },
  { tile: "#fde4f1", accent: "#c2336f" },
];

export function categoryStyle(name: string): CategoryStyle {
  const key = ALIASES[name.trim().toLowerCase()];
  if (key) return ICONS[key];
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0);
  return FALLBACKS[hash % FALLBACKS.length];
}
