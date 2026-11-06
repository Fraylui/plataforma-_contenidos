/** Estado de una historia en el panel: cuánto le queda, hace cuánto terminó o «Destacada» (no caduca). */
export function storyTimeLabel(story: { expiresAt: string; highlighted: boolean }, now: Date): string {
  if (story.highlighted) return "Destacada";
  const diffMinutes = Math.round((Date.parse(story.expiresAt) - now.getTime()) / 60_000);
  const minutes = Math.abs(diffMinutes);
  const amount = minutes < 60 ? `${minutes} min` : minutes < 24 * 60 ? `${Math.round(minutes / 60)} h` : `${Math.round(minutes / (24 * 60))} d`;
  return diffMinutes > 0 ? `quedan ${amount}` : `terminó hace ${amount}`;
}
