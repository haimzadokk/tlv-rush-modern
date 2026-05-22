import { SKINS, skinEmoji, type SkinId } from "@/game/skins";

type Props = {
  coins: number;
  ownedSkins: SkinId[];
  selectedSkin: SkinId;
  onBuy: (id: SkinId) => void;
  onSelect: (id: SkinId) => void;
  onClose: () => void;
};

export function Shop({ coins, ownedSkins, selectedSkin, onBuy, onSelect, onClose }: Props) {
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
          <h2 className="text-xl font-black text-white">🛍 חנות</h2>
          <div className="text-[10px] uppercase tracking-widest text-white/50">
            בחר את הסגנון שלך
          </div>
        </div>
        <div className="rounded-full bg-amber-400/20 px-3 py-1.5 text-sm font-bold text-amber-300">
          🪙 {coins}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {SKINS.map((s) => {
          const owned = ownedSkins.includes(s.id);
          const selected = selectedSkin === s.id;
          const canBuy = !owned && coins >= s.price;
          const accentColor = s.colors.shirt;
          return (
            <div
              key={s.id}
              className={`relative overflow-hidden rounded-2xl border p-3 transition ${
                selected
                  ? "border-amber-400 bg-amber-400/10 shadow-[0_0_30px_rgba(251,191,36,0.25)]"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-inner ring-2 ring-white/10"
                  style={{ background: accentColor }}
                >
                  {skinEmoji(s.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{s.name}</div>
                  <div className="text-xs text-white/60 truncate">{s.description}</div>
                  <div
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      s.perk.kind === "none"
                        ? "bg-white/10 text-white/50"
                        : "bg-amber-400/15 text-amber-300"
                    }`}
                  >
                    {s.perkLabel}
                  </div>
                </div>
                {owned ? (
                  <button
                    onClick={() => onSelect(s.id)}
                    disabled={selected}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      selected
                        ? "bg-amber-400 text-black"
                        : "bg-white/15 text-white active:scale-95"
                    }`}
                  >
                    {selected ? "✓ נבחר" : "בחר"}
                  </button>
                ) : (
                  <button
                    onClick={() => canBuy && onBuy(s.id)}
                    disabled={!canBuy}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      canBuy
                        ? "bg-gradient-to-br from-amber-300 to-orange-500 text-black active:scale-95"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    🪙 {s.price}
                  </button>
                )}
              </div>
              {selected && (
                <div className="pointer-events-none absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
