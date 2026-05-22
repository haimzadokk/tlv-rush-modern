export function GameOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-black/40 via-black/60 to-black/85 px-6 backdrop-blur-sm"
    >
      {children}
    </div>
  );
}
