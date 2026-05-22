import type { LandmarkKind } from "./types";

export type LandmarkInfo = {
  kind: LandmarkKind;
  hebrew: string;
  /** Short label rendered on/under the landmark itself. */
  label: string;
  /** Banner text shown when the landmark passes the player. */
  toast: string;
  /** Tower height multiplier (0..1+). */
  heightScale: number;
  /** Tower width multiplier. */
  widthScale: number;
};

export const LANDMARKS: Record<LandmarkKind, LandmarkInfo> = {
  azrieli_round: {
    kind: "azrieli_round",
    hebrew: "עזריאלי העגול",
    label: "מגדלי עזריאלי",
    toast: "עברת ליד מגדלי עזריאלי",
    heightScale: 1.55,
    widthScale: 0.85,
  },
  azrieli_triangle: {
    kind: "azrieli_triangle",
    hebrew: "עזריאלי המשולש",
    label: "מגדלי עזריאלי",
    toast: "עברת ליד מגדלי עזריאלי",
    heightScale: 1.4,
    widthScale: 1.0,
  },
  azrieli_square: {
    kind: "azrieli_square",
    hebrew: "עזריאלי המרובע",
    label: "מגדלי עזריאלי",
    toast: "עברת ליד מגדלי עזריאלי",
    heightScale: 1.5,
    widthScale: 0.95,
  },
  migdal_shalom: {
    kind: "migdal_shalom",
    hebrew: "מגדל שלום",
    label: "מגדל שלום",
    toast: "מגדל שלום באופק",
    heightScale: 1.35,
    widthScale: 0.95,
  },
  dizengoff_center: {
    kind: "dizengoff_center",
    hebrew: "דיזנגוף סנטר",
    label: "דיזנגוף סנטר",
    toast: "דיזנגוף סנטר באופק",
    heightScale: 0.85,
    widthScale: 1.4,
  },
  menorah_hall: {
    kind: "menorah_hall",
    hebrew: "היכל מנורה",
    label: "היכל הכדורסל מנורה",
    toast: "היכל הכדורסל מנורה באופק",
    heightScale: 0.7,
    widthScale: 1.5,
  },
  kirya: {
    kind: "kirya",
    hebrew: "הקריה",
    label: "הקריה",
    toast: "הקריה באופק",
    heightScale: 1.1,
    widthScale: 1.1,
  },
  yafo_clock: {
    kind: "yafo_clock",
    hebrew: "מגדל השעון",
    label: "מגדל השעון יפו",
    toast: "עברת ליד מגדל השעון",
    heightScale: 1.15,
    widthScale: 0.55,
  },
};

/** Which landmarks can spawn in which zone (by zone id). */
export const LANDMARKS_BY_ZONE: Record<string, LandmarkKind[]> = {
  sarona: ["azrieli_round", "azrieli_triangle", "azrieli_square", "kirya"],
  florentin: ["migdal_shalom"],
  rothschild: ["migdal_shalom"],
  carmel: ["menorah_hall"],
  beach: [],
  jaffa: ["yafo_clock"],
  dizengoff: ["dizengoff_center"],
  cyber: ["azrieli_round", "kirya", "azrieli_triangle"],
};

export function pickLandmarkFor(zoneId: string): LandmarkKind | null {
  const list = LANDMARKS_BY_ZONE[zoneId];
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}
