import { GameOverlay } from "./GameOverlay";
import { SettingsToggles } from "./SettingsToggles";

type Props = {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onLegend: () => void;
};

export function GamePause({ onResume, onRestart, onMenu, onLegend }: Props) {
  return (
    <GameOverlay>
      <div className="mb-2 text-xs uppercase tracking-widest text-white/60">הפסקה</div>
      <h2 className="mb-6 text-4xl font-black text-white">המשחק מושהה</h2>
      <button
        onClick={onResume}
        className="mb-3 rounded-full bg-amber-400 px-12 py-3.5 text-lg font-bold text-black shadow-[0_8px_30px_rgba(251,191,36,0.5)] transition active:scale-95"
      >
        ▶ המשך
      </button>
      <button
        onClick={onRestart}
        className="mb-3 rounded-full bg-white/15 px-10 py-2.5 text-sm font-bold text-white transition active:scale-95"
      >
        🔄 התחל מחדש
      </button>
      <button
        onClick={onLegend}
        className="mb-3 rounded-full bg-white/10 px-10 py-2 text-xs font-bold text-white/90 transition active:scale-95"
      >
        ❓ מקרא צבעי השובל
      </button>
      <SettingsToggles className="mb-3" />
      <button onClick={onMenu} className="text-xs text-white/60 underline">
        חזור לתפריט
      </button>
    </GameOverlay>
  );
}
