import { getSkin, skinEmoji, type SkinId } from "@/game/skins";
import { missionById, type MissionsState } from "@/game/missions";
import { SettingsToggles } from "./SettingsToggles";

type Props = {
  selectedSkin: SkinId;
  walletCoins: number;
  best: number;
  missions: MissionsState;
  onPlay: () => void;
  onChangeCharacter: () => void;
  onShop: () => void;
  onMissions: () => void;
  onLegend: () => void;
};

export function GameMenu({
  selectedSkin,
  walletCoins,
  best,
  missions,
  onPlay,
  onChangeCharacter,
  onShop,
  onMissions,
  onLegend,
}: Props) {
  const skin = getSkin(selectedSkin);
  const challengeDef = missionById(missions.challenge.id);
  const challengeProgress = Math.min(
    missions.progress[missions.challenge.id] ?? 0,
    challengeDef.target,
  );
  const challengePct = (challengeProgress / challengeDef.target) * 100;
  const challengeDone = challengeProgress >= challengeDef.target;

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
        {/* Skyline silhouette with Azrieli + Migdal Shalom hints */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          height="180"
          viewBox="0 0 400 180"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sky-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(34,211,238,0)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.25)" />
            </linearGradient>
          </defs>
          {/* Far buildings — flat, dark */}
          <path
            d="M 0 180 L 0 120 L 30 120 L 30 80 L 50 80 L 50 100 L 80 100 L 80 60 L 100 60 L 100 100 L 130 100 L 130 70 L 160 70 L 160 95 L 195 95 L 195 50 L 220 50 L 220 90 L 255 90 L 255 75 L 285 75 L 285 110 L 320 110 L 320 65 L 345 65 L 345 95 L 380 95 L 380 110 L 400 110 L 400 180 Z"
            fill="rgba(0,0,0,0.6)"
          />
          {/* Azrieli triplet hint (round-triangle-square as silhouettes) */}
          <ellipse cx="170" cy="55" rx="9" ry="50" fill="rgba(0,0,0,0.75)" />
          <polygon points="185,105 195,30 205,105" fill="rgba(0,0,0,0.78)" />
          <rect x="208" y="40" width="14" height="65" fill="rgba(0,0,0,0.78)" />
          {/* Neon window dots */}
          <g fill="#22d3ee" opacity="0.7">
            <circle cx="170" cy="40" r="0.9" />
            <circle cx="170" cy="60" r="0.9" />
            <circle cx="170" cy="80" r="0.9" />
            <circle cx="195" cy="60" r="0.9" />
            <circle cx="215" cy="55" r="0.9" />
            <circle cx="215" cy="75" r="0.9" />
            <circle cx="215" cy="95" r="0.9" />
          </g>
          {/* Floor glow */}
          <rect x="0" y="100" width="400" height="80" fill="url(#sky-glow)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-start px-5 pb-5 pt-6">
        {/* Title block */}
        <div className="mb-1 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-300/70">
            ENDLESS RUNNER
          </div>
          <h1 className="mt-0.5 font-black tracking-tight">
            <span className="block bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-6xl text-transparent drop-shadow-[0_8px_30px_rgba(251,191,36,0.5)] leading-none">
              TLV
            </span>
            <span className="-mt-1 block bg-gradient-to-br from-fuchsia-400 via-rose-400 to-cyan-300 bg-clip-text text-4xl text-transparent leading-none">
              RUSH
            </span>
          </h1>
          <div className="mt-2 text-sm font-bold text-white">רוץ. התחמק. שרוד את תל אביב.</div>
          <div className="mt-1 max-w-[260px] mx-auto text-[11px] leading-snug text-white/55">
            שליחים, קורקינטים, מזגנים וניאון — העיר שלא עוצרת מחכה לך.
          </div>
        </div>

        {/* Hero character preview */}
        <div className="mt-3 mb-3">
          <HeroCharacter skinId={selectedSkin} />
        </div>

        {/* Stats strip */}
        <div className="mb-3 flex items-center gap-2">
          <Pill icon="🪙" label="מטבעות" value={walletCoins} />
          {best > 0 && <Pill icon="🏆" label="שיא" value={best} />}
        </div>

        {/* Play button — big and glowy */}
        <button
          onClick={onPlay}
          className="group relative mb-3 overflow-hidden rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 px-16 py-4 text-xl font-black text-black shadow-[0_16px_60px_rgba(251,191,36,0.65)] transition active:scale-95"
        >
          <span className="relative z-10">▶ התחל ריצה</span>
          <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-active:translate-x-[100%]" />
        </button>

        {/* Character card */}
        <button
          onClick={onChangeCharacter}
          className="mb-3 flex w-full max-w-[320px] items-center gap-3 rounded-2xl border border-white/15 bg-black/40 px-4 py-2.5 text-right backdrop-blur-sm active:scale-[0.98]"
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ring-1 ring-white/20"
            style={{
              background: `linear-gradient(135deg, ${skin.colors.shirt}, ${skin.colors.accent})`,
            }}
          >
            {skinEmoji(selectedSkin)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-white/45">הדמות שלך</div>
            <div className="text-sm font-black text-white truncate">{skin.name}</div>
            <div className="text-[11px] text-amber-300/90 truncate">{skin.perkLabel}</div>
          </div>
          <div className="text-[11px] font-bold text-cyan-300/80">החלף ›</div>
        </button>

        {/* Daily Hook */}
        <div className="mb-3 w-full max-w-[320px] overflow-hidden rounded-2xl border border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-600/25 to-violet-700/20 px-4 py-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="rounded-full bg-fuchsia-400/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-fuchsia-100">
              🌟 אתגר היום
            </div>
            <div className="text-xs font-black text-amber-300">🪙 {missions.challenge.reward}</div>
          </div>
          <div className="text-sm font-bold text-white truncate">{challengeDef.label}</div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-300 transition-all"
              style={{ width: `${challengePct}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-white/65">
            <span>
              {Math.floor(challengeProgress)} / {challengeDef.target} {challengeDef.unit}
            </span>
            {challengeDone && !missions.challengeClaimed && (
              <span className="font-bold text-amber-300">לחץ &quot;משימות&quot; לאיסוף</span>
            )}
            {missions.challengeClaimed && (
              <span className="font-bold text-emerald-400">✓ נאסף</span>
            )}
          </div>
        </div>

        {/* Secondary nav cards */}
        <div className="mb-3 grid w-full max-w-[320px] grid-cols-3 gap-2">
          <NavCard onClick={onShop} icon="🛍" label="חנות" />
          <NavCard onClick={onMissions} icon="🎯" label="משימות" />
          <NavCard onClick={onLegend} icon="❓" label="איך משחקים" />
        </div>

        <SettingsToggles className="mb-2" />
      </div>
    </div>
  );
}

function HeroCharacter({ skinId }: { skinId: SkinId }) {
  const skin = getSkin(skinId);
  return (
    <div className="relative flex items-end justify-center">
      {/* Glow base */}
      <div
        className="absolute bottom-0 h-3 w-32 rounded-full blur-md"
        style={{ background: `radial-gradient(closest-side, ${skin.colors.shirt}, transparent)` }}
      />
      <div className="relative h-[120px] w-[110px]">
        {/* Bobbing character emoji as a stand-in idle animation */}
        <div
          className="absolute inset-0 flex items-center justify-center text-[88px] leading-none"
          style={{ animation: "tlv-hero-bob 1.6s ease-in-out infinite" }}
        >
          <span
            className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
            style={{ filter: `drop-shadow(0 0 12px ${skin.colors.shirt}88)` }}
          >
            {skinEmoji(skinId)}
          </span>
        </div>
        <style>{`@keyframes tlv-hero-bob {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-6px) }
        }`}</style>
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

function NavCard({ onClick, icon, label }: { onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-2 py-3 text-white backdrop-blur-sm transition hover:bg-white/15 active:scale-95"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[11px] font-bold">{label}</span>
    </button>
  );
}
