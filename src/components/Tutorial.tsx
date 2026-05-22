import { GameOverlay } from "./GameOverlay";

type Props = { onDone: () => void };

type Step = {
  num: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
};

const STEPS: Step[] = [
  {
    num: "1",
    icon: "↔️",
    title: "החלפת נתיב",
    desc: "החלק שמאלה או ימינה כדי לעבור נתיב",
    color: "from-rose-500 to-red-500",
  },
  {
    num: "2",
    icon: "⬆️",
    title: "קפיצה",
    desc: "החלק למעלה כדי לקפוץ מעל מכשולים נמוכים",
    color: "from-amber-400 to-orange-500",
  },
  {
    num: "3",
    icon: "⬇️",
    title: "התכופפות",
    desc: "החלק למטה כדי להתכופף מתחת לטיפטופים",
    color: "from-cyan-400 to-blue-500",
  },
  {
    num: "4",
    icon: "💨",
    title: "Dash",
    desc: "תקתוק כפול על המסך — זינוק בלתי פגיע (cooldown 3.5ש׳)",
    color: "from-fuchsia-500 to-purple-500",
  },
];

export function Tutorial({ onDone }: Props) {
  return (
    <GameOverlay>
      <div className="mb-1 text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">
        HOW TO PLAY
      </div>
      <h2 className="mb-4 text-3xl font-black text-white">איך משחקים</h2>
      <div className="mb-5 w-full max-w-xs space-y-2.5">
        {STEPS.map((s) => (
          <div
            key={s.num}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2.5"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-base font-black text-white shadow-md`}
            >
              {s.num}
            </div>
            <div className="text-2xl">{s.icon}</div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-sm font-bold text-white">{s.title}</div>
              <div className="text-[11px] leading-snug text-white/65">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onDone}
        className="rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-12 py-3.5 text-lg font-black text-black shadow-[0_10px_36px_rgba(251,191,36,0.5)] transition active:scale-95"
      >
        הבנתי, יאללה!
      </button>
      <p className="mt-3 text-[11px] text-white/40">
        תוכל לפתוח שוב דרך &quot;איך משחקים&quot; בתפריט
      </p>
    </GameOverlay>
  );
}
