import { readJSON, writeJSON } from "./storage";

const KEY = "tlv-runner-achievements";

export type AchievementId =
  | "first_run"
  | "coins_100"
  | "coins_500"
  | "icecream_10"
  | "combo_10"
  | "near_miss_5"
  | "zones_all"
  | "score_2000"
  | "score_5000"
  | "dash_50"
  | "survive_2min";

export type AchievementDef = {
  id: AchievementId;
  label: string;
  desc: string;
  emoji: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_run", label: "ריצה ראשונה", desc: "השלם ריצה אחת", emoji: "🏃" },
  { id: "coins_100", label: "אספן זוטא", desc: "אסוף 100 מטבעות בסך הכל", emoji: "🪙" },
  { id: "coins_500", label: "ארנק מלא", desc: "אסוף 500 מטבעות בסך הכל", emoji: "💰" },
  { id: "icecream_10", label: "מכור לגלידה", desc: "אסוף 10 גלידות בסך הכל", emoji: "🍦" },
  { id: "combo_10", label: "קומבו!", desc: "השג Combo x10", emoji: "🔥" },
  { id: "near_miss_5", label: "כמעט!", desc: "בצע 5 Near Miss בריצה אחת", emoji: "😅" },
  { id: "zones_all", label: "תייר אמיתי", desc: "בקר בכל האזורים בריצה אחת", emoji: "🗺️" },
  { id: "score_2000", label: "שורד", desc: "השג ניקוד 2000", emoji: "⭐" },
  { id: "score_5000", label: "אגדה", desc: "השג ניקוד 5000", emoji: "👑" },
  { id: "dash_50", label: "Dash master", desc: "השתמש ב-Dash 50 פעמים", emoji: "💨" },
  { id: "survive_2min", label: "ראש שקט", desc: "שרוד 2 דקות ללא פגיעה", emoji: "🧘" },
];

export type AchievementsState = {
  unlocked: Record<AchievementId, boolean>;
  counters: { coinsTotal: number; iceCreamsTotal: number; dashTotal: number };
};

function freshAchievements(): AchievementsState {
  const unlocked = {} as Record<AchievementId, boolean>;
  for (const a of ACHIEVEMENTS) unlocked[a.id] = false;
  return { unlocked, counters: { coinsTotal: 0, iceCreamsTotal: 0, dashTotal: 0 } };
}

export function loadAchievements(): AchievementsState {
  const raw = readJSON<AchievementsState | null>(KEY, null);
  if (!raw) {
    const fresh = freshAchievements();
    writeJSON(KEY, fresh);
    return fresh;
  }
  // backfill new achievements
  const merged = freshAchievements();
  merged.counters = { ...merged.counters, ...raw.counters };
  for (const a of ACHIEVEMENTS) {
    merged.unlocked[a.id] = raw.unlocked[a.id] ?? false;
  }
  return merged;
}

export function saveAchievements(state: AchievementsState) {
  writeJSON(KEY, state);
}

export type RunEventStats = {
  coinsThisRun: number;
  iceCreamsThisRun: number;
  dashesThisRun: number;
  highestCombo: number;
  nearMissesThisRun: number;
  zonesVisited: number;
  longestUnhitMs: number;
  score: number;
};

/** Apply this run's events and return newly-unlocked achievements. */
export function applyRunForAchievements(
  state: AchievementsState,
  e: RunEventStats,
): { newlyUnlocked: AchievementId[]; state: AchievementsState } {
  const newlyUnlocked: AchievementId[] = [];
  const unlock = (id: AchievementId, cond: boolean) => {
    if (cond && !state.unlocked[id]) {
      state.unlocked[id] = true;
      newlyUnlocked.push(id);
    }
  };
  state.counters.coinsTotal += e.coinsThisRun;
  state.counters.iceCreamsTotal += e.iceCreamsThisRun;
  state.counters.dashTotal += e.dashesThisRun;

  unlock("first_run", true);
  unlock("coins_100", state.counters.coinsTotal >= 100);
  unlock("coins_500", state.counters.coinsTotal >= 500);
  unlock("icecream_10", state.counters.iceCreamsTotal >= 10);
  unlock("combo_10", e.highestCombo >= 10);
  unlock("near_miss_5", e.nearMissesThisRun >= 5);
  unlock("zones_all", e.zonesVisited >= 8);
  unlock("score_2000", e.score >= 2000);
  unlock("score_5000", e.score >= 5000);
  unlock("dash_50", state.counters.dashTotal >= 50);
  unlock("survive_2min", e.longestUnhitMs >= 120000);

  return { newlyUnlocked, state };
}

export function achievementById(id: AchievementId): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
