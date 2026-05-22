import { useEffect, useState } from "react";
import { survivalTitle } from "@/game/titles";
import { getSkin, skinEmoji, type SkinId } from "@/game/skins";
import type { RunStats } from "@/game/types";

type Achievement = { id: string; label: string; emoji: string };

type Props = {
  runStats: RunStats;
  best: number;
  isNewBest: boolean;
  shareCopied: boolean;
  newAchievements: Achievement[];
  character: SkinId;
  missionsProgressed: number;
  onReplay: () => void;
  onShare: () => void;
  onMenu: () => void;
  onMissions: () => void;
  onShop: () => void;
};

export function GameOver({
  runStats,
  best,
  isNewBest,
  shareCopied,
  newAchievements,
  character,
  missionsProgressed,
  onReplay,
  onShare,
  onMenu,
  onMissions,
  onShop,
}: Props) {
  const title = survivalTitle(runStats.score);
  const skin = getSkin(character);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      dir="rtl"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-black/55 via-black/75 to-black/95 px-6 backdrop-blur-md"
    >
      {/* New record fireworks */}
      {isNewBest && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-2 w-2 rounded-full bg-amber-300"
              style={{
                left: `${(i * 53) % 100}%`,
                top: `${20 + ((i * 37) % 60)}%`,
                animation: `tlv-fw 1.4s ease-out ${(i % 6) * 0.12}s infinite`,
                background: ["#fde047", "#f472b6", "#22d3ee", "#a3e635", "#fb923c"][i % 5],
              }}
            />
          ))}
          <style>{`@keyframes tlv-fw {
            0% { transform: scale(0); opacity: 1 }
            70% { transform: scale(2.2); opacity: 0.7 }
            100% { transform: scale(3.6); opacity: 0 }
          }`}</style>
        </div>
      )}

      <div
        className={`relative w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950/80 p-6 text-center shadow-2xl transition-all duration-500 ${
          shown ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        <div className="mb-2 text-xs uppercase tracking-[0.3em] text-white/50">סוף ריצה</div>
        {isNewBest && (
          <div className="mb-2 inline-block rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-0.5 text-xs font-black text-black">
            ✨ שיא חדש! ✨
          </div>
        )}
        <div className="mb-1 bg-gradient-to-br from-white via-amber-200 to-amber-400 bg-clip-text text-6xl font-black tabular-nums text-transparent">
          {runStats.score}
        </div>
        <div className="text-3xl">{title.emoji}</div>
        <div className="mt-1 text-lg font-bold text-amber-300">{title.title}</div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-sm text-white/80">
          <Stat label="מטרים" value={runStats.meters} />
          <Stat label="🪙 מטבעות" value={runStats.coins} />
          <Stat label="🍦 גלידות" value={runStats.iceCreams} />
          <Stat label="אזורים" value={runStats.zonesVisited} />
          <Stat label="🔥 Combo שיא" value={runStats.highestCombo} />
          <Stat label="😅 Near Miss" value={runStats.nearMisses} />
        </div>

        {/* Character + missions strip */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2.5 text-right">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ring-1 ring-white/15"
            style={{
              background: `linear-gradient(135deg, ${skin.colors.shirt}, ${skin.colors.accent})`,
            }}
          >
            {skinEmoji(character)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-white/45">רצת עם</div>
            <div className="text-sm font-black text-white truncate">{skin.name}</div>
            <div className="text-[11px] text-amber-300/90 truncate">{skin.perkLabel}</div>
          </div>
          {missionsProgressed > 0 && (
            <div className="flex flex-col items-center rounded-xl bg-fuchsia-500/20 px-2.5 py-1.5">
              <div className="text-base font-black text-fuchsia-200 leading-none">
                +{missionsProgressed}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-fuchsia-200/80">משימות</div>
            </div>
          )}
        </div>

        {newAchievements.length > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              🏅 הישגים חדשים
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {newAchievements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white"
                >
                  <span>{a.emoji}</span>
                  <span>{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 text-xs text-white/50">שיא אישי: {best}</div>

        <button
          onClick={onReplay}
          className="mt-5 w-full rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-10 py-3.5 text-lg font-black text-black shadow-[0_10px_40px_rgba(251,191,36,0.5)] transition active:scale-95"
        >
          ▶ רוץ שוב
        </button>
        <button
          onClick={onShare}
          className="mt-3 rounded-full bg-white/15 px-6 py-2 text-sm font-bold text-white transition active:scale-95"
        >
          {shareCopied ? "✓ הועתק!" : "📣 שתף ניקוד"}
        </button>
        <div className="mt-4 flex justify-center gap-4 text-xs">
          <button onClick={onMenu} className="text-white/60 underline">
            תפריט
          </button>
          <button onClick={onMissions} className="text-white/60 underline">
            משימות
          </button>
          <button onClick={onShop} className="text-white/60 underline">
            חנות
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-mono text-lg font-bold tabular-nums text-white">{value}</div>
    </div>
  );
}
