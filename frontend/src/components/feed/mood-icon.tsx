import { Heart, Lightbulb, Smiley, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { MoodKey } from "@/lib/moods";
import { cn } from "@/lib/utils";

/** Mismo ícono y color que la reacción del post (ver ReactionBar), en versión de servidor. */
const STYLE: Record<MoodKey, { icon: typeof Heart; color: string }> = {
  FUNNY: { icon: Smiley, color: "from-amber-300 to-orange-500" },
  WOW: { icon: Sparkle, color: "from-violet-400 to-indigo-600" },
  INSPIRED: { icon: Lightbulb, color: "from-sky-400 to-cyan-600" },
  LOVE: { icon: Heart, color: "from-rose-400 to-pink-600" },
};

export function MoodIcon({ mood }: { mood: MoodKey }) {
  const { icon: Icon, color } = STYLE[mood];
  return (
    <span aria-hidden="true" className={cn("flex size-7 items-center justify-center rounded-full bg-linear-to-br text-white", color)}>
      <Icon weight="fill" className="size-4" />
    </span>
  );
}
