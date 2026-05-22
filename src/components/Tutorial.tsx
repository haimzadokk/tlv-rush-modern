import { GameOverlay } from "./GameOverlay";

type Props = { onDone: () => void };

export function Tutorial({ onDone }: Props) {
  return (
    <GameOverlay>
      <h2 className="mb-4 text-3xl font-black text-white">איך משחקים</h2>
      <ul className="mb-6 max-w-xs space-y-3 text-right text-sm text-white/85">
        <li className="flex items-center gap-3">
          <span className="text-2xl">↔️</span>
          <span>החלקה שמאלה/ימינה — החלפת נתיב</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="text-2xl">⬆️</span>
          <span>החלקה למעלה — קפיצה מעל קורקינטים</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="text-2xl">⬇️</span>
          <span>החלקה למטה — התכופפות מתחת למזגנים</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <span>הקשה כפולה — Dash בלתי פגיע (קולדאון)</span>
        </li>
      </ul>
      <button
        onClick={onDone}
        className="rounded-full bg-amber-400 px-12 py-3.5 text-lg font-bold text-black shadow-[0_8px_30px_rgba(251,191,36,0.5)] transition active:scale-95"
      >
        הבנתי, יאללה!
      </button>
      <p className="mt-3 text-[11px] text-white/40">לא נציג שוב את ההסבר</p>
    </GameOverlay>
  );
}
