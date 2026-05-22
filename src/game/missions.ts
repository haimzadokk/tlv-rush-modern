import { readJSON, storageKeys, writeJSON } from "./storage";

export type MissionId =
  | "run1000"
  | "run2500"
  | "coins50"
  | "coins150"
  | "dodge10"
  | "dodge25"
  | "icecream3"
  | "icecream5"
  | "dash5"
  | "dash15"
  | "survive45"
  | "survive90"
  | "zones3"
  | "zones5"
  | "nearmiss5"
  | "combo5"
  | "combo10"
  | "beach45"
  | "powerups3"
  | "ironwill";

export type MissionDef = {
  id: MissionId;
  label: string;
  target: number;
  reward: number;
  unit: string;
  /** Cumulative across runs (false = best-of-run, true = accumulating). */
  accumulates: boolean;
};

export const MISSION_POOL: MissionDef[] = [
  { id: "run1000", label: "רוץ 1000 מטר", target: 1000, reward: 50, unit: "מ׳", accumulates: true },
  {
    id: "run2500",
    label: "רוץ 2500 מטר",
    target: 2500,
    reward: 110,
    unit: "מ׳",
    accumulates: true,
  },
  { id: "coins50", label: "אסוף 50 מטבעות", target: 50, reward: 40, unit: "🪙", accumulates: true },
  {
    id: "coins150",
    label: "אסוף 150 מטבעות",
    target: 150,
    reward: 100,
    unit: "🪙",
    accumulates: true,
  },
  {
    id: "dodge10",
    label: "התחמק מ-10 שליחים",
    target: 10,
    reward: 50,
    unit: "",
    accumulates: true,
  },
  {
    id: "dodge25",
    label: "התחמק מ-25 שליחים",
    target: 25,
    reward: 110,
    unit: "",
    accumulates: true,
  },
  { id: "icecream3", label: "אסוף 3 גלידות", target: 3, reward: 50, unit: "🍦", accumulates: true },
  { id: "icecream5", label: "אסוף 5 גלידות", target: 5, reward: 90, unit: "🍦", accumulates: true },
  {
    id: "dash5",
    label: "השתמש ב-Dash 5 פעמים",
    target: 5,
    reward: 40,
    unit: "💨",
    accumulates: true,
  },
  {
    id: "dash15",
    label: "השתמש ב-Dash 15 פעמים",
    target: 15,
    reward: 100,
    unit: "💨",
    accumulates: true,
  },
  {
    id: "survive45",
    label: "שרוד 45 ש׳ בלי להיפגע",
    target: 45,
    reward: 70,
    unit: "ש׳",
    accumulates: false,
  },
  {
    id: "survive90",
    label: "שרוד 90 ש׳ בלי להיפגע",
    target: 90,
    reward: 150,
    unit: "ש׳",
    accumulates: false,
  },
  {
    id: "zones3",
    label: "עבור 3 אזורים בריצה אחת",
    target: 3,
    reward: 60,
    unit: "",
    accumulates: false,
  },
  {
    id: "zones5",
    label: "עבור 5 אזורים בריצה אחת",
    target: 5,
    reward: 130,
    unit: "",
    accumulates: false,
  },
  {
    id: "nearmiss5",
    label: "בצע 5 Near Miss בריצה אחת",
    target: 5,
    reward: 70,
    unit: "",
    accumulates: false,
  },
  { id: "combo5", label: "השג Combo x5", target: 5, reward: 50, unit: "", accumulates: false },
  { id: "combo10", label: "השג Combo x10", target: 10, reward: 120, unit: "", accumulates: false },
  {
    id: "beach45",
    label: "שרוד באזור החוף 45 ש׳",
    target: 45,
    reward: 80,
    unit: "ש׳",
    accumulates: false,
  },
  {
    id: "powerups3",
    label: "אסוף 3 Power-ups בריצה",
    target: 3,
    reward: 55,
    unit: "",
    accumulates: false,
  },
  {
    id: "ironwill",
    label: "ריצה אחת ללא להיפגע",
    target: 1,
    reward: 200,
    unit: "",
    accumulates: false,
  },
];

/** Index by id for O(1) lookups. */
const POOL_BY_ID: Record<MissionId, MissionDef> = MISSION_POOL.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<MissionId, MissionDef>,
);

export function missionById(id: MissionId): MissionDef {
  return POOL_BY_ID[id];
}

// Daily Challenge: a bigger, single mission that rotates daily.
export type DailyChallenge = {
  id: MissionId;
  reward: number;
};

/** Deterministic daily PRNG based on the date string. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function dateSeed(dateStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Choose 5 daily missions deterministically from the pool by date. */
export function pickDailyMissions(dateStr: string): MissionId[] {
  const shuffled = seededShuffle(MISSION_POOL, dateSeed(dateStr));
  return shuffled.slice(0, 5).map((m) => m.id);
}

/** Choose 1 Daily Challenge (always a tougher mission). */
export function pickDailyChallenge(dateStr: string): DailyChallenge {
  // Pick from the tougher half (higher reward).
  const tough = MISSION_POOL.filter((m) => m.reward >= 100);
  const shuffled = seededShuffle(tough, dateSeed(dateStr) ^ 0xa5a5a5);
  const m = shuffled[0];
  return { id: m.id, reward: Math.round(m.reward * 1.6) };
}

export type MissionsState = {
  date: string; // yyyy-mm-dd
  daily: MissionId[];
  challenge: DailyChallenge;
  progress: Partial<Record<MissionId, number>>;
  claimed: Partial<Record<MissionId, boolean>>;
  challengeClaimed: boolean;
};

function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function freshState(): MissionsState {
  const date = todayKey();
  return {
    date,
    daily: pickDailyMissions(date),
    challenge: pickDailyChallenge(date),
    progress: {},
    claimed: {},
    challengeClaimed: false,
  };
}

export function loadMissions(): MissionsState {
  const raw = readJSON<MissionsState | null>(storageKeys.missions, null);
  const today = todayKey();
  if (!raw || raw.date !== today) {
    const fresh = freshState();
    writeJSON(storageKeys.missions, fresh);
    return fresh;
  }
  return raw;
}

export function saveMissions(state: MissionsState) {
  writeJSON(storageKeys.missions, state);
}

export type RunStatsForMissions = {
  meters: number;
  coins: number;
  dodgedCouriers: number;
  iceCreams: number;
  dashes: number;
  longestUnhitSeconds: number;
  zonesVisited: number;
  nearMisses: number;
  highestCombo: number;
  beachSurvivedSeconds: number;
  powerupsCollected: number;
  hitsThisRun: number;
};

/** Apply this run's stats to the active daily missions + challenge. */
export function applyRunStats(
  state: MissionsState,
  s: RunStatsForMissions,
): { newlyCompleted: MissionId[]; state: MissionsState } {
  const newlyCompleted: MissionId[] = [];

  const value = (id: MissionId): number => {
    switch (id) {
      case "run1000":
        return Math.floor(s.meters);
      case "run2500":
        return Math.floor(s.meters);
      case "coins50":
        return s.coins;
      case "coins150":
        return s.coins;
      case "dodge10":
        return s.dodgedCouriers;
      case "dodge25":
        return s.dodgedCouriers;
      case "icecream3":
        return s.iceCreams;
      case "icecream5":
        return s.iceCreams;
      case "dash5":
        return s.dashes;
      case "dash15":
        return s.dashes;
      case "survive45":
        return Math.floor(s.longestUnhitSeconds);
      case "survive90":
        return Math.floor(s.longestUnhitSeconds);
      case "zones3":
        return s.zonesVisited;
      case "zones5":
        return s.zonesVisited;
      case "nearmiss5":
        return s.nearMisses;
      case "combo5":
        return s.highestCombo;
      case "combo10":
        return s.highestCombo;
      case "beach45":
        return Math.floor(s.beachSurvivedSeconds);
      case "powerups3":
        return s.powerupsCollected;
      case "ironwill":
        return s.hitsThisRun === 0 ? 1 : 0;
    }
  };

  const applyTo = (id: MissionId) => {
    const def = missionById(id);
    if (!def) return;
    const v = value(id);
    const prev = state.progress[id] ?? 0;
    const next = def.accumulates ? prev + v : Math.max(prev, v);
    const capped = Math.min(def.target, next);
    if (prev < def.target && capped >= def.target) newlyCompleted.push(id);
    state.progress[id] = capped;
  };

  for (const id of state.daily) applyTo(id);
  // challenge mirrors its base id progress
  applyTo(state.challenge.id);

  return { newlyCompleted, state };
}

export function claimReward(
  state: MissionsState,
  id: MissionId,
): { state: MissionsState; coins: number } {
  const def = missionById(id);
  if (!def) return { state, coins: 0 };
  if (state.claimed[id]) return { state, coins: 0 };
  if ((state.progress[id] ?? 0) < def.target) return { state, coins: 0 };
  state.claimed[id] = true;
  return { state, coins: def.reward };
}

export function claimChallenge(state: MissionsState): { state: MissionsState; coins: number } {
  if (state.challengeClaimed) return { state, coins: 0 };
  const def = missionById(state.challenge.id);
  if (!def) return { state, coins: 0 };
  if ((state.progress[state.challenge.id] ?? 0) < def.target) return { state, coins: 0 };
  state.challengeClaimed = true;
  return { state, coins: state.challenge.reward };
}
