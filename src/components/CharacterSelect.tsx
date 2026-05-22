import { useState } from "react";
import { getSkin, skinEmoji, STARTER_CHARACTERS, type SkinId } from "@/game/skins";

type Props = {
  /** Currently selected character (or null on first run). */
  current: SkinId | null;
  /** Called when the player confirms a character. */
  onConfirm: (id: SkinId) => void;
  /** Called when the player cancels (only available if a character was previously chosen). */
  onCancel: () => void;
  /** Whether the user has chosen before — controls header text + cancel availability. */
  hasPicked: boolean;
};

export function CharacterSelect({ current, onConfirm, onCancel, hasPicked }: Props) {
  const [picked, setPicked] = useState<SkinId>(current ?? STARTER_CHARACTERS[0]);

  return (
    <div
      dir="rtl"
      className="absolute inset-0 z-30 flex flex-col overflow-hidden bg-gradient-to-b from-violet-950 via-fuchsia-950 to-black"
    >
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div
          className="absolute -right-20 bottom-40 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse"
          style={{ animationDelay: "1.4s" }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4 backdrop-blur-sm">
        {hasPicked ? (
          <button
            onClick={onCancel}
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white active:scale-95"
          >
            ← ביטול
          </button>
        ) : (
          <div className="w-16" />
        )}
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">
            CHOOSE YOUR RUNNER
          </div>
          <h2 className="text-xl font-black text-white">בחר דמות</h2>
        </div>
        <div className="w-16" />
      </div>

      <div className="relative z-10 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <p className="mb-2 text-center text-xs text-white/60">
          לכל דמות יכולת ייחודית שתלווה אותך לאורך הריצה
        </p>

        {STARTER_CHARACTERS.map((id) => {
          const skin = getSkin(id);
          const isSelected = picked === id;
          return (
            <button
              key={id}
              onClick={() => setPicked(id)}
              className={`w-full overflow-hidden rounded-2xl border-2 p-4 text-right transition active:scale-[0.98] ${
                isSelected
                  ? "border-amber-400 bg-amber-400/10 shadow-[0_0_30px_rgba(251,191,36,0.25)]"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-4xl shadow-inner ring-2 ring-white/15"
                  style={{
                    background: `linear-gradient(135deg, ${skin.colors.shirt}, ${skin.colors.accent})`,
                  }}
                >
                  {skinEmoji(id)}
                  {isSelected && (
                    <div className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-black shadow-md">
                      ✓
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-black text-white">{skin.name}</div>
                  <div className="mt-0.5 text-xs text-white/65 leading-snug">
                    {skin.description}
                  </div>
                  <div className="mt-1.5 inline-block rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                    {skin.perkLabel}
                  </div>
                </div>
              </div>
              {skin.tagline && (
                <div className="mt-3 border-t border-white/5 pt-2 text-[11px] italic text-white/55">
                  &ldquo;{skin.tagline}&rdquo;
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="relative z-10 border-t border-white/10 bg-black/60 px-4 pb-6 pt-4 backdrop-blur-sm">
        <button
          onClick={() => onConfirm(picked)}
          className="group relative w-full overflow-hidden rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 px-10 py-4 text-xl font-black text-black shadow-[0_12px_45px_rgba(251,191,36,0.55)] transition active:scale-95"
        >
          <span className="relative z-10">יאללה לרוץ ▶</span>
          <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-active:translate-x-[100%]" />
        </button>
      </div>
    </div>
  );
}
