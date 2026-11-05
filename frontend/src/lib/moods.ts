/**
 * «Según cómo te quieres sentir»: cada ánimo es una de las reacciones de la
 * gente (ver ReactionBar). El feed de un ánimo trae lo que más provocó esa
 * reacción. La dirección usa el verbo: /animo/reirme.
 */
export const MOODS = [
  { key: "FUNNY", slug: "reirme", label: "Quiero reírme", title: "Para reírte" },
  { key: "WOW", slug: "sorprenderme", label: "Quiero sorprenderme", title: "Para sorprenderte" },
  { key: "INSPIRED", slug: "inspirarme", label: "Quiero inspirarme", title: "Para inspirarte" },
  { key: "LOVE", slug: "enamorarme", label: "Quiero enamorarme", title: "Lo que más enamoró" },
] as const;

export type MoodKey = (typeof MOODS)[number]["key"];

export function moodFromSlug(slug: string) {
  return MOODS.find((m) => m.slug === slug) ?? null;
}

export function isMoodKey(value: string | null | undefined): value is MoodKey {
  return MOODS.some((m) => m.key === value);
}
