import { getSkin, type SkinId } from "@/game/skins";
import { SettingsToggles } from "./SettingsToggles";

type Props = {
  selectedSkin: SkinId;
  walletCoins: number;
  best: number;
  onPlay: () => void;
  onShop: () => void;
  onMissions: () => void;
  onLegend: () => void;
};

export function GameMenu({
  selectedSkin,
  walletCoins,
  best,
  onPlay,
  onShop,
  onMissions,
  onLegend,
}: Props) {
  const skin = getSkin(selectedSkin);
  return (
    <div
      dir="rtl"
      className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-gradient-to-b from-violet-950 via-fuchsia-950 to-black"
    >
      {/* Animated cyber background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div
          className="absolute -right-20 top-1/2 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        {/* Scanlines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 4px)",
          }}
        />
        {/* Skyline silhouette */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          height="180"
          viewBox="0 0 400 180"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 180 L 0 120 L 30 120 L 30 80 L 50 80 L 50 100 L 80 100 L 80 60 L 100 60 L 100 100 L 130 100 L 130 70 L 160 70 L 160 95 L 195 95 L 195 50 L 220 50 L 220 90 L 255 90 L 255 75 L 285 75 L 285 110 L 320 110 L 320 65 L 345 65 L 345 95 L 380 95 L 380 110 L 400 110 L 400 180 Z"
            fill="rgba(0,0,0,0.55)"
          />
          <path
            d="M 60 95 L 70 95 L 70 100 M 100 80 L 110 80 L 110 85 M 200 65 L 210 65 L 210 70 M 290 90 L 300 90 L 300 95"
            stroke="#22d3ee"
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-6 pt-10">
        {/* Title block */}
        <div className="mb-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-300/70">
            ENDLESS RUNNER
          </div>
          <h1 className="mt-1 font-black tracking-tight">
            <span className="block bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-7xl text-transparent drop-shadow-[0_8px_30px_rgba(251,191,36,0.5)]">
              TLV
            </span>
            <span className="-mt-2 block bg-gradient-to-br from-fuchsia-400 via-rose-400 to-cyan-300 bg-clip-text text-5xl text-transparent">
              RUSH
            </span>
          </h1>
        </div>

        {/* Stats strip */}
        <div className="mb-6 flex items-center gap-2">
          <Pill icon="🪙" label="מטבעות" value={walletCoins} />
          {best > 0 && <Pill icon="🏆" label="שיא" value={best} />}
        </div>

        {/* Skin preview chip */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/15 bg-black/40 px-4 py-2.5 backdrop-blur-sm">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: skin.colors.shirt }}
          >
            <span className="text-lg">{skinEmoji(selectedSkin)}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60">סקין נבחר</div>
            <div className="text-sm font-bold text-white">{skin.name}</div>
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={onPlay}
          className="group relative mb-5 overflow-hidden rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 px-14 py-4 text-xl font-black text-black shadow-[0_12px_50px_rgba(251,191,36,0.55)] transition active:scale-95"
        >
          <span className="relative z-10">▶ התחל ריצה</span>
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-active:translate-x-[100%] transition-transform duration-500" />
        </button>

        {/* Secondary actions */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <MenuButton onClick={onShop} icon="🛍" label="חנות" />
          <MenuButton onClick={onMissions} icon="🎯" label="משימות" />
          <MenuButton onClick={onLegend} icon="❓" label="מקרא" />
        </div>

        <SettingsToggles className="mb-3" />

        <div className="max-w-xs text-center text-[11px] leading-relaxed text-white/40">
          החלק שמאל/ימין למעבר נתיב • למעלה לקפיצה • למטה להתכופפות • הקשה כפולה ל-Dash
        </div>
      </div>
    </div>
  );
}

function Pill({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-sm">{icon}</span>
      <div className="text-right">
        <div className="text-[9px] uppercase tracking-wider text-white/50">{label}</div>
        <div className="font-mono text-sm font-bold tabular-nums text-white leading-none">
          {value}
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 text-white backdrop-blur-sm transition hover:bg-white/15 active:scale-95"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

function skinEmoji(id: SkinId): string {
  switch (id) {
    case "hightechist":
      return "💻";
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
