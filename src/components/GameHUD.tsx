import type { PowerHUDState } from "@/game/types";
import { HEART_MAX } from "@/game/constants";

type Props = {
  hearts: number;
  score: number;
  coinsHUD: number;
  zoneName: string;
  power: PowerHUDState;
  combo: { count: number; multiplier: number; kind: string | null };
  onPause: () => void;
};

export function GameHUD({ hearts, score, coinsHUD, zoneName, power, combo, onPause }: Props) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1.5 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-sm">
            {Array.from({ length: HEART_MAX }).map((_, i) => (
              <Heart key={i} filled={i < hearts} />
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-sm font-bold text-amber-300 backdrop-blur-sm">
            🪙 <span className="tabular-nums">{coinsHUD}</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <button
            onClick={onPause}
            className="pointer-events-auto rounded-full bg-black/55 px-3 py-2 text-base font-bold text-white backdrop-blur-sm active:scale-95"
            aria-label="השהיה"
          >
            ⏸
          </button>
          <div className="rounded-2xl bg-black/45 px-4 py-2 text-right text-white backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-widest opacity-70">{zoneName}</div>
            <div className="font-mono text-2xl font-bold tabular-nums leading-none">{score}</div>
          </div>
        </div>
      </div>

      {/* Combo banner */}
      {combo.count >= 3 && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 select-none">
          <div
            key={combo.count}
            className="rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-400/30 to-orange-500/30 px-5 py-1.5 text-center shadow-[0_4px_24px_rgba(251,191,36,0.45)] backdrop-blur-sm animate-in fade-in zoom-in duration-200"
          >
            <div className="font-mono text-xl font-black text-amber-200 tabular-nums leading-tight">
              COMBO x{combo.count}
            </div>
            <div className="text-[10px] font-bold text-amber-100/80 tracking-widest">
              ×{combo.multiplier} ניקוד
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 text-xs font-bold">
        {power.shield && <Badge color="bg-cyan-500/80">🛡 מגן</Badge>}
        {power.coffee > 0 && <Badge color="bg-lime-500/80">☕ x2 ({power.coffee})</Badge>}
        {power.magnet > 0 && <Badge color="bg-blue-500/80">🚌 רב-קו ({power.magnet})</Badge>}
        {power.shades > 0 && (
          <Badge color="bg-amber-400/80 text-black">😎 x2 ({power.shades})</Badge>
        )}
        {power.scooter > 0 && <Badge color="bg-orange-500/80">🛴 Boost ({power.scooter})</Badge>}
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5">
        <div
          className={`rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-sm ${
            power.dashCD > 0
              ? "bg-black/45 text-white/70"
              : "bg-cyan-500/80 text-white shadow-[0_0_18px_rgba(34,211,238,0.6)]"
          }`}
        >
          {power.dashCD > 0 ? `💨 ${power.dashCD}` : "💨 Dash מוכן!"}
        </div>
      </div>
    </>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"
        fill={filled ? "#ef4444" : "rgba(255,255,255,0.15)"}
        stroke={filled ? "#fff" : "rgba(255,255,255,0.4)"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-full ${color} px-3 py-1 text-white shadow-lg backdrop-blur-sm`}>
      {children}
    </div>
  );
}
