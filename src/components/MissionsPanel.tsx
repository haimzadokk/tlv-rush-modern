import { missionById, type MissionId, type MissionsState } from "@/game/missions";

type Props = {
  state: MissionsState;
  onClaim: (id: MissionId) => void;
  onClaimChallenge: () => void;
  onClose: () => void;
};

export function MissionsPanel({ state, onClaim, onClaimChallenge, onClose }: Props) {
  const challengeDef = missionById(state.challenge.id);
  const challengeProgress = Math.min(state.progress[state.challenge.id] ?? 0, challengeDef.target);
  const challengeDone = challengeProgress >= challengeDef.target;
  const challengePct = (challengeProgress / challengeDef.target) * 100;

  return (
    <div
      dir="rtl"
      className="absolute inset-0 z-30 flex flex-col bg-gradient-to-b from-violet-950 via-zinc-950 to-black"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white active:scale-95"
        >
          ← סגור
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black text-white">🎯 משימות יומיות</h2>
          <div className="text-[10px] uppercase tracking-widest text-white/50">{state.date}</div>
        </div>
        <div className="w-16" />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {/* Daily Challenge — premium card */}
        <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-600/25 to-violet-700/20 p-4 shadow-[0_0_30px_rgba(192,38,211,0.25)]">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-fuchsia-400/30 blur-2xl" />
          <div className="relative">
            <div className="mb-1 flex items-center justify-between">
              <div className="rounded-full bg-fuchsia-400/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-fuchsia-100">
                🌟 אתגר היום
              </div>
              <div className="text-sm font-black text-amber-300">🪙 {state.challenge.reward}</div>
            </div>
            <div className="text-base font-bold text-white">{challengeDef.label}</div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-300 transition-all"
                style={{ width: `${challengePct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-white/70">
                {Math.floor(challengeProgress)} / {challengeDef.target} {challengeDef.unit}
              </div>
              {challengeDone && !state.challengeClaimed && (
                <button
                  onClick={onClaimChallenge}
                  className="rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-4 py-1.5 text-xs font-black text-black active:scale-95"
                >
                  קבל פרס
                </button>
              )}
              {state.challengeClaimed && (
                <div className="text-xs font-bold text-emerald-400">✓ נאסף</div>
              )}
            </div>
          </div>
        </div>

        <div className="px-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
          5 משימות יומיות
        </div>

        {state.daily.map((id) => {
          const m = missionById(id);
          const progress = Math.min(state.progress[id] ?? 0, m.target);
          const pct = (progress / m.target) * 100;
          const done = progress >= m.target;
          const claimed = state.claimed[id];
          return (
            <div key={id} className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-bold text-white">{m.label}</div>
                <div className="text-xs font-bold text-amber-300">🪙 {m.reward}</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-white/60">
                  {Math.floor(progress)} / {m.target} {m.unit}
                </div>
                {done && !claimed && (
                  <button
                    onClick={() => onClaim(id)}
                    className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-black active:scale-95"
                  >
                    קבל פרס
                  </button>
                )}
                {claimed && <div className="text-xs font-bold text-emerald-400">✓ נאסף</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
