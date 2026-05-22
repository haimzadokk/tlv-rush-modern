export function GameOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      className="absolute inset-0 z-20 overflow-y-auto bg-gradient-to-b from-black/40 via-black/60 to-black/85 backdrop-blur-sm"
    >
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-8">
        {children}
      </div>
    </div>
  );
}
