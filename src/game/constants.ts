import type { ObstacleKind } from "./types";

export const LANES = 3;
export const HEART_MAX = 3;
export const TRACK_VISUAL_START_Z = 0.05;
export const OBSTACLE_SPAWN_Z = 0.06;
export const PICKUP_SPAWN_Z = 0.07;
export const TRACK_VISUAL_PLAYER_Z = 0.96;

export const OBSTACLE_MIN_LANE_GAP = 0.35;
export const PICKUP_OBSTACLE_MIN_GAP = 0.18;

export const HUD_UPDATE_INTERVAL_MS = 180;

/** Required action to dodge each obstacle kind. */
export const OBSTACLE_BEHAVIOR: Record<ObstacleKind, "lane" | "jump" | "duck"> = {
  wolt: "lane",
  street_person: "lane",
  ac: "duck",
  scooter: "jump",
  car: "lane",
  dog: "jump",
  tourist: "lane",
  trash: "jump",
  matkot: "jump",
};

/** Z-distance at which an obstacle in the player's lane counts as a near-miss. */
export const NEAR_MISS_Z_MIN = 0.85;
export const NEAR_MISS_Z_MAX = 0.93;
/** Lane distance (fractional) under which a same-lane pass counts as a near-miss. */
export const NEAR_MISS_LANE_DIST = 0.35;

/** Power-up durations in ms. */
export const POWERUP_MS = {
  coffee: 5000,
  magnet: 6000,
  shades: 6000,
  scooter: 4000,
} as const;

export const DASH_DURATION_MS = 500;
export const DASH_COOLDOWN_MS = 3500;
export const JUMP_INITIAL_V = 1.6;
