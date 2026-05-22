import { useState } from "react";
import { getSound, setSound, getVibrate, setVibrate } from "@/game/settings";

export function SettingsToggles({ className = "" }: { className?: string }) {
  const [sound, setS] = useState<boolean>(() => getSound());
  const [vibrate, setV] = useState<boolean>(() => getVibrate());
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        aria-pressed={sound}
        onClick={() => {
          const next = !sound;
          setSound(next);
          setS(next);
        }}
        className={`rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 ${
          sound ? "bg-amber-400 text-black" : "bg-white/15 text-white/70"
        }`}
      >
        {sound ? "🔊 סאונד" : "🔇 סאונד"}
      </button>
      <button
        type="button"
        aria-pressed={vibrate}
        onClick={() => {
          const next = !vibrate;
          setVibrate(next);
          setV(next);
          if (next && typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(20);
          }
        }}
        className={`rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 ${
          vibrate ? "bg-amber-400 text-black" : "bg-white/15 text-white/70"
        }`}
      >
        {vibrate ? "📳 רטט" : "🚫 רטט"}
      </button>
    </div>
  );
}
