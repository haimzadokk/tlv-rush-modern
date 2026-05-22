export type ObstacleKind =
  | "wolt"
  | "street_person"
  | "ac"
  | "scooter"
  | "car"
  | "dog"
  | "tourist"
  | "trash"
  | "matkot";

export type PickupKind =
  | "coin"
  | "icecream"
  | "coffee"
  | "helmet"
  | "ravkav"
  | "sunglasses"
  | "shield"
  | "scooter_boost";

export type Lane = 0 | 1 | 2;

export type Obstacle = {
  kind: ObstacleKind;
  lane: Lane;
  z: number;
  seed: number;
  passed?: boolean;
  counted?: boolean;
  nearMissed?: boolean;
};

export type Pickup = {
  kind: PickupKind;
  lane: Lane;
  z: number;
  seed: number;
  collected?: boolean;
  lateralOffset?: number;
};

export type LandmarkKind =
  | "azrieli_round"
  | "azrieli_triangle"
  | "azrieli_square"
  | "migdal_shalom"
  | "dizengoff_center"
  | "menorah_hall"
  | "kirya"
  | "yafo_clock";

export type Building = {
  side: -1 | 1;
  z: number;
  height: number;
  width: number;
  color: string;
  isAmPm: boolean;
  seed: number;
  /** Pre-computed lit-window pattern, frozen at spawn. */
  windowSeed: number;
  /** If set, render as a named iconic landmark instead of a generic building. */
  landmark?: LandmarkKind;
  /** If true, the pass-by toast has already been fired. */
  announced?: boolean;
};

export type FloatText = {
  x: number;
  y: number;
  text: string;
  color: string;
  t: number;
};

export type PowerHUDState = {
  shield: boolean;
  coffee: number;
  magnet: number;
  shades: number;
  scooter: number;
  dashCD: number;
};

export type RunStats = {
  meters: number;
  iceCreams: number;
  coins: number;
  zonesVisited: number;
  score: number;
  highestCombo: number;
  nearMisses: number;
  zoneId: string;
};

export type GameView = "menu" | "character" | "playing" | "paused" | "over" | "shop" | "missions";
