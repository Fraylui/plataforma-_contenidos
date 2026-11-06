import type { StoryBackground } from "@/lib/api/types";

/** Degradado de cada fondo de solo texto (tokens --story-* de globals.css), para `background-image`. */
export const STORY_BACKGROUNDS: Record<StoryBackground, string> = {
  SUNSET: "var(--story-sunset)",
  OCEAN: "var(--story-ocean)",
  FOREST: "var(--story-forest)",
  NIGHT: "var(--story-night)",
};

/** Para elegir en el compositor, en este orden. */
export const STORY_BACKGROUND_OPTIONS: { value: StoryBackground; label: string }[] = [
  { value: "SUNSET", label: "Atardecer" },
  { value: "OCEAN", label: "Mar" },
  { value: "FOREST", label: "Bosque" },
  { value: "NIGHT", label: "Noche" },
];
