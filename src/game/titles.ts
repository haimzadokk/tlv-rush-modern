export function survivalTitle(score: number): { title: string; emoji: string } {
  if (score < 200) return { title: "תייר מבולבל", emoji: "🧳" };
  if (score < 800) return { title: "תל אביבי מתחיל", emoji: "🌆" };
  if (score < 2000) return { title: "שורד שדרות", emoji: "🌳" };
  if (score < 5000) return { title: "מלך רוטשילד", emoji: "👑" };
  return { title: "אגדה אורבנית", emoji: "🔥" };
}
