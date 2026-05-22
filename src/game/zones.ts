export type ZoneEffect = "none" | "graffiti" | "market" | "beach" | "night" | "cyber" | "stone";

export type Zone = {
  id: string;
  name: string;
  hebrew: string;
  /** Banner subtitle shown when entering this zone. */
  subtitle: string;
  /** Sky gradient: [top, bottom]. */
  sky: [string, string];
  road: string;
  roadLine: string;
  buildingPalette: string[];
  accent: string;
  /** Hint of mood — used to tweak skyline opacity, lights, etc. */
  effect: ZoneEffect;
  /** If true, road lines glow (neon). */
  neon?: boolean;
  /** When true, windows are lit (night mode). */
  litWindows?: boolean;
};

export const ZONES: Zone[] = [
  {
    id: "sarona",
    name: "Sarona",
    hebrew: "שרונה",
    subtitle: "בניינים גבוהים. זכוכית. הייטק.",
    sky: ["#fbcfa3", "#f6e3c9"],
    road: "#3a3a42",
    roadLine: "#f5d97a",
    buildingPalette: ["#cfd8e3", "#a8b6c6", "#e6ecf2", "#8fa0b3"],
    accent: "#5fb7e6",
    effect: "none",
  },
  {
    id: "florentin",
    name: "Florentin",
    hebrew: "פלורנטין",
    subtitle: "גרפיטי. צבעים. רוק.",
    sky: ["#2a1b3d", "#c93f6b"],
    road: "#1f1f24",
    roadLine: "#ff5fa2",
    buildingPalette: ["#d96b3c", "#e8b04a", "#7fb069", "#3a7ca5", "#c64c54"],
    accent: "#ffd23f",
    effect: "graffiti",
  },
  {
    id: "rothschild",
    name: "Rothschild",
    hebrew: "רוטשילד",
    subtitle: "שדרה. עצים. קפה.",
    sky: ["#0f2027", "#2c5364"],
    road: "#2a2a30",
    roadLine: "#ffe066",
    buildingPalette: ["#f4ead5", "#e8d9b5", "#c9b48a", "#a68a64"],
    accent: "#ffb86b",
    effect: "none",
  },
  {
    id: "carmel",
    name: "Carmel",
    hebrew: "שוק הכרמל",
    subtitle: "דוכנים. צבעים. מהומה.",
    sky: ["#f59e0b", "#dc2626"],
    road: "#4a3225",
    roadLine: "#fde68a",
    buildingPalette: ["#dc2626", "#f59e0b", "#ec4899", "#84cc16", "#06b6d4"],
    accent: "#fbbf24",
    effect: "market",
  },
  {
    id: "beach",
    name: "Beach",
    hebrew: "החוף",
    subtitle: "ים. טיילת. מטקות.",
    sky: ["#fde68a", "#22d3ee"],
    road: "#d2b48c",
    roadLine: "#fff7ed",
    buildingPalette: ["#ffffff", "#fef3c7", "#fde68a", "#bae6fd"],
    accent: "#0ea5e9",
    effect: "beach",
  },
  {
    id: "jaffa",
    name: "Jaffa",
    hebrew: "יפו",
    subtitle: "אבן. קשתות. סמטאות.",
    sky: ["#3b1f0a", "#fb923c"],
    road: "#7a5230",
    roadLine: "#fef3c7",
    buildingPalette: ["#c2925f", "#d4a574", "#a17753", "#8b6440", "#6f4f30"],
    accent: "#f59e0b",
    effect: "stone",
  },
  {
    id: "dizengoff",
    name: "Dizengoff",
    hebrew: "דיזנגוף",
    subtitle: "חנויות. אורות. רחוב.",
    sky: ["#1e1b4b", "#7c3aed"],
    road: "#2a2a30",
    roadLine: "#f472b6",
    buildingPalette: ["#a78bfa", "#f472b6", "#fde047", "#22d3ee", "#fb923c"],
    accent: "#f472b6",
    effect: "night",
    litWindows: true,
  },
  {
    id: "cyber",
    name: "Cyber TLV",
    hebrew: "Cyber TLV",
    subtitle: "מצב לילה. ניאון. עתיד.",
    sky: ["#020617", "#312e81"],
    road: "#0a0a14",
    roadLine: "#22d3ee",
    buildingPalette: ["#1e1b4b", "#312e81", "#4c1d95", "#831843", "#0f172a"],
    accent: "#22d3ee",
    effect: "cyber",
    neon: true,
    litWindows: true,
  },
];

/** Distance per zone (in game units). Cycles after the last zone. */
export const ZONE_DISTANCE = 50;

export function zoneForDistance(distance: number): { index: number; zone: Zone } {
  const raw = Math.floor(Math.max(0, distance) / ZONE_DISTANCE);
  const idx = raw % ZONES.length;
  return { index: idx, zone: ZONES[idx] };
}
