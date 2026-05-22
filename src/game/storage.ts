const PREFIX = "tlv-runner";

export const storageKeys = {
  best: `${PREFIX}-best`,
  coins: `${PREFIX}-coins`,
  ownedSkins: `${PREFIX}-owned-skins`,
  selectedSkin: `${PREFIX}-selected-skin`,
  selectedCharacter: `${PREFIX}-selected-character`,
  characterChosen: `${PREFIX}-character-chosen`,
  missions: `${PREFIX}-missions`,
  tutorialDone: `${PREFIX}-tutorial-done`,
  sound: `${PREFIX}-sound`,
  vibrate: `${PREFIX}-vibrate`,
};

export function readNumber(key: string, fallback = 0): number {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (raw === null || raw === "") return fallback;
  const v = Number(raw);
  return Number.isFinite(v) ? v : fallback;
}

export function writeNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, String(value));
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function readString(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export function writeString(key: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}
