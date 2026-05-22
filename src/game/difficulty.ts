// Difficulty Director — pure functions returning current spawn/speed parameters
// based on how far the player has run. Keeps tuning in one place.

export type DifficultyParams = {
  /** Base movement speed (game units per ms). */
  baseSpeed: number;
  /** ms between obstacle spawns. */
  obstacleSpawnMs: number;
  /** ms between coin trail spawns. */
  coinSpawnMs: number;
  /** ms between power-up spawns. */
  powerupSpawnMs: number;
  /** Probability [0..1] of spawning a complex multi-lane warning. */
  complexChance: number;
  /** Cap on simultaneous obstacles. */
  maxObstacles: number;
};

const BASELINE: DifficultyParams = {
  baseSpeed: 0.0026,
  obstacleSpawnMs: 1500,
  coinSpawnMs: 2200,
  powerupSpawnMs: 11000,
  complexChance: 0.0,
  maxObstacles: 6,
};

/** Returns difficulty parameters for the given run distance (game units). */
export function difficultyFor(distance: number): DifficultyParams {
  // Smooth easing: tier 0 → 1 → 2 → 3 → max as distance grows
  // tiers roughly: <60 (Sarona), 60-180 (Florentin/Rothschild), 180-360, 360+
  const t = Math.max(0, distance);
  const speedRamp = Math.min(0.0014, t * 0.0000025);
  const spawnAccel = Math.min(700, t * 1.4);
  const coinAccel = Math.min(800, t * 1.5);
  const complex = Math.min(0.35, t * 0.0008);
  const powerScarcity = Math.min(7000, t * 11);

  return {
    baseSpeed: BASELINE.baseSpeed + speedRamp,
    obstacleSpawnMs: Math.max(700, BASELINE.obstacleSpawnMs - spawnAccel),
    coinSpawnMs: Math.max(1300, BASELINE.coinSpawnMs - coinAccel),
    powerupSpawnMs: BASELINE.powerupSpawnMs + powerScarcity,
    complexChance: complex,
    maxObstacles: 6 + Math.floor(t / 200),
  };
}

/** A small jitter applied to spawn intervals to prevent rhythmic monotony. */
export function jitter(ms: number, factor = 0.3): number {
  return ms + (Math.random() - 0.5) * ms * factor;
}
