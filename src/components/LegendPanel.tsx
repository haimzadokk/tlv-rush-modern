import { GameOverlay } from "./GameOverlay";

type Props = {
  onClose: () => void;
};

type Row = {
  label: string;
  action: string;
  emoji: string;
  near: string;
  far: string;
};

const ROWS: Row[] = [
  {
    label: "להתחמק לצד",
    action: "החלק שמאל/ימין",
    emoji: "↔️",
    near: "rgb(239,68,68)",
    far: "rgb(80,20,40)",
  },
  {
    label: "לקפוץ מעל",
    action: "החלק למעלה",
    emoji: "⬆️",
    near: "rgb(253,224,71)",
    far: "rgb(120,70,30)",
  },
  {
    label: "להתכופף מתחת",
    action: "החלק למטה",
    emoji: "⬇️",
    near: "rgb(34,211,238)",
    far: "rgb(20,50,90)",
  },
];

const POWERUPS = [
  { emoji: "☕", name: "קפה קר", desc: "x2 מהירות וניקוד" },
  { emoji: "🪖", name: "קסדה", desc: "מגן מפגיעה אחת" },
  { emoji: "🛡", name: "Shield עתידני", desc: "מגן זמני (6 שניות)" },
  { emoji: "🚌", name: "רב-קו", desc: "מושך מטבעות" },
  { emoji: "😎", name: "משקפי שמש", desc: "x2 ניקוד" },
  { emoji: "🛴", name: "Boost", desc: "מהירות + חסינות" },
  { emoji: "🍦", name: "גלידה", desc: "מוסיף לב" },
];

export function LegendPanel({ onClose }: Props) {
  return (
    <GameOverlay>
      <div className="mb-1 text-xs uppercase tracking-widest text-white/60">מקרא</div>
      <h2 className="mb-3 text-3xl font-black text-white">איך לשחק</h2>
      <p className="mb-4 max-w-xs text-center text-xs text-white/70 leading-relaxed">
        לכל מכשול שובל צבעוני שמסמן איך להתחמק. הצבע מתחזק ככל שהמכשול מתקרב.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-2">
        {ROWS.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-3 rounded-2xl bg-white/10 p-2.5 backdrop-blur-sm"
          >
            <div
              className="h-9 w-16 shrink-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${r.far} 0%, ${r.near} 100%)`,
                boxShadow: `0 0 18px ${r.near}99`,
              }}
            />
            <div className="flex-1 text-right">
              <div className="text-sm font-bold text-white">
                {r.emoji} {r.label}
              </div>
              <div className="text-[11px] text-white/60">{r.action}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 w-full max-w-xs">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50">
          Power-ups
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          {POWERUPS.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-1.5 rounded-lg bg-white/8 px-2 py-1.5"
            >
              <span className="text-base">{p.emoji}</span>
              <div className="min-w-0">
                <div className="font-bold text-white truncate">{p.name}</div>
                <div className="text-white/55 truncate">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 max-w-xs text-center text-[11px] text-white/55 leading-relaxed">
        💨 הקשה כפולה — Dash. 🔥 התחמקויות רצופות בונות Combo.
      </div>
      <button
        onClick={onClose}
        className="mt-5 rounded-full bg-amber-400 px-10 py-3 text-base font-bold text-black shadow-[0_8px_30px_rgba(251,191,36,0.5)] active:scale-95"
      >
        הבנתי
      </button>
    </GameOverlay>
  );
}
