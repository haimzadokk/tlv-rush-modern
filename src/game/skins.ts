export type SkinId =
  | "tlv_runner"
  | "hightechist"
  | "blogger"
  | "surfer"
  | "tourist"
  | "barista"
  | "delivery"
  | "cyber"
  | "king";

export type SkinColors = {
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  accent: string;
};

export type SkinPerk =
  | { kind: "none" }
  | { kind: "start_shield" }
  | { kind: "long_coffee"; multiplier: number }
  | { kind: "more_coins"; multiplier: number }
  | { kind: "high_jump"; multiplier: number }
  | { kind: "dash_cooldown"; multiplier: number };

export type SkinDef = {
  id: SkinId;
  name: string;
  description: string;
  perkLabel: string;
  /** Headline pitch shown in character selection. */
  tagline?: string;
  perk: SkinPerk;
  price: number;
  colors: SkinColors;
  hat?: "cap" | "beanie" | "visor" | "sun" | "crown" | "none";
  prop?: "headphones" | "coffee" | "camera" | "surfboard" | "bag" | "neon" | "phone" | "none";
};

export const SKINS: SkinDef[] = [
  {
    id: "tlv_runner",
    name: "רץ תל אביבי",
    description: "הקלאסיקה. גופייה צהובה ואוזניות.",
    perkLabel: "ללא יכולת מיוחדת",
    perk: { kind: "none" },
    price: 0,
    colors: {
      shirt: "#fbbf24",
      pants: "#1f2937",
      skin: "#e0b48c",
      hair: "#1a1a1a",
      accent: "#ffffff",
    },
    prop: "headphones",
  },
  {
    id: "hightechist",
    name: "הייטקיסט",
    description: "לבוש מודרני, תיק לפטופ, נעליים קלות.",
    tagline: "הייטקיסט — חד, מהיר, ותמיד עם גיבוי בענן.",
    perkLabel: "🛡 מתחיל עם מגן",
    perk: { kind: "start_shield" },
    price: 0,
    colors: {
      shirt: "#0ea5e9",
      pants: "#0f172a",
      skin: "#dca97f",
      hair: "#3b2a1d",
      accent: "#f8fafc",
    },
    prop: "bag",
  },
  {
    id: "blogger",
    name: "בלוגרית",
    description: "סטייל צבעוני, טלפון ביד, אנרגיה חברתית.",
    tagline: "בלוגרית — הופכת כל ריצה לסטורי ויראלי.",
    perkLabel: "🪙 +25% מטבעות",
    perk: { kind: "more_coins", multiplier: 1.25 },
    price: 0,
    colors: {
      shirt: "#f472b6",
      pants: "#fef3c7",
      skin: "#e7c4a3",
      hair: "#6b3e1a",
      accent: "#fbcfe8",
    },
    prop: "phone",
  },
  {
    id: "surfer",
    name: "גולש",
    description: "לבוש חוף, משקפי שמש, אווירת ים.",
    tagline: "גולש — זורם עם העיר וקופץ מעל כל מכשול.",
    perkLabel: "↑ קפיצה גבוהה ב-20%",
    perk: { kind: "high_jump", multiplier: 1.2 },
    price: 0,
    colors: {
      shirt: "#22d3ee",
      pants: "#fef3c7",
      skin: "#d68b53",
      hair: "#f5deb3",
      accent: "#fff",
    },
    prop: "surfboard",
  },
  {
    id: "tourist",
    name: "תייר",
    description: "מצלמה, כובע שמש, מפה ביד.",
    perkLabel: "🪙 +25% מטבעות",
    perk: { kind: "more_coins", multiplier: 1.25 },
    price: 100,
    colors: {
      shirt: "#ef4444",
      pants: "#0ea5e9",
      skin: "#e7c4a3",
      hair: "#6b3e1a",
      accent: "#fff",
    },
    hat: "sun",
    prop: "camera",
  },
  {
    id: "barista",
    name: "בריסטה",
    description: "סינר חום, כובע צמר, ריח של פולים.",
    perkLabel: "☕ קפה נמשך 50% יותר",
    perk: { kind: "long_coffee", multiplier: 1.5 },
    price: 130,
    colors: {
      shirt: "#7c2d12",
      pants: "#1c1917",
      skin: "#d6a37a",
      hair: "#3a2418",
      accent: "#fef3c7",
    },
    hat: "beanie",
    prop: "coffee",
  },
  {
    id: "delivery",
    name: "שליח לשעבר",
    description: "מכיר את הכבישים מבפנים.",
    perkLabel: "💨 Dash cooldown קצר ב-30%",
    perk: { kind: "dash_cooldown", multiplier: 0.7 },
    price: 160,
    colors: {
      shirt: "#0d9488",
      pants: "#0c0a09",
      skin: "#d6a37a",
      hair: "#171717",
      accent: "#22d3ee",
    },
    hat: "cap",
    prop: "bag",
  },
  {
    id: "cyber",
    name: "Cyber Runner",
    description: "ישר מ-Cyber TLV. ניאון בכל הגוף.",
    perkLabel: "💨 Dash מהיר + 🛡 מגן פתיחה",
    perk: { kind: "start_shield" },
    price: 250,
    colors: {
      shirt: "#22d3ee",
      pants: "#1e1b4b",
      skin: "#e0d3ff",
      hair: "#a78bfa",
      accent: "#f0abfc",
    },
    hat: "visor",
    prop: "neon",
  },
  {
    id: "king",
    name: "מלך תל אביב",
    description: "השיא של השיאים. כתר בלבד.",
    perkLabel: "🪙 +25% + ↑ קפיצה",
    perk: { kind: "more_coins", multiplier: 1.25 },
    price: 500,
    colors: {
      shirt: "#a78bfa",
      pants: "#1e1b4b",
      skin: "#e0b48c",
      hair: "#fbbf24",
      accent: "#fde047",
    },
    hat: "crown",
    prop: "headphones",
  },
];

/** Free starter characters offered in the character-select screen. */
export const STARTER_CHARACTERS: SkinId[] = ["hightechist", "blogger", "surfer"];

export const DEFAULT_SKIN: SkinId = "tlv_runner";

export function getSkin(id: SkinId): SkinDef {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

export function skinEmoji(id: SkinId): string {
  switch (id) {
    case "hightechist":
      return "💻";
    case "blogger":
      return "📱";
    case "surfer":
      return "🏄";
    case "tourist":
      return "📸";
    case "barista":
      return "☕";
    case "delivery":
      return "🛵";
    case "cyber":
      return "🤖";
    case "king":
      return "👑";
    default:
      return "🏃";
  }
}
