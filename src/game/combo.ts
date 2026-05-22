// Combo + Near-Miss scoring.
// Combo grows when the player dodges or grazes obstacles in close succession.
// It decays after a window of inactivity. Near-miss = obstacle passed in the
// same lane while the player was airborne / crouched but very close.

export type ComboState = {
  count: number;
  decayMs: number; // ms until combo decays
  multiplier: number; // visible score multiplier (1..4)
  /** Optional: which kind of feedback triggered the last increment, for HUD UX. */
  lastKind: "dodge" | "near" | "perfect" | null;
};

export const COMBO_WINDOW_MS = 2400;

export function newCombo(): ComboState {
  return { count: 0, decayMs: 0, multiplier: 1, lastKind: null };
}

function multiplierFor(count: number): number {
  if (count >= 20) return 4;
  if (count >= 12) return 3;
  if (count >= 6) return 2;
  if (count >= 3) return 1.5;
  return 1;
}

export function tickCombo(c: ComboState, dt: number) {
  if (c.decayMs > 0) {
    c.decayMs -= dt;
    if (c.decayMs <= 0) {
      c.count = 0;
      c.multiplier = 1;
      c.lastKind = null;
    }
  }
}

export function bumpCombo(c: ComboState, kind: "dodge" | "near" | "perfect") {
  c.count += 1;
  c.decayMs = COMBO_WINDOW_MS;
  c.multiplier = multiplierFor(c.count);
  c.lastKind = kind;
}

export function breakCombo(c: ComboState) {
  c.count = 0;
  c.decayMs = 0;
  c.multiplier = 1;
  c.lastKind = null;
}

/** Returns score awarded for an event (coin/dodge/etc.) given combo state. */
export function scoreWithCombo(baseScore: number, c: ComboState): number {
  return Math.round(baseScore * c.multiplier);
}

/** Bonus for a near-miss (graze) — visible feedback like Subway Surfers. */
export function nearMissBonus(): number {
  return 25;
}

/** Perfect dodge bonus (e.g. timed jump/crouch over an obstacle). */
export function perfectDodgeBonus(): number {
  return 50;
}
