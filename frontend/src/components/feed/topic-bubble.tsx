import { cn } from "@/lib/utils";
import { ThumbImage } from "@/components/ui/thumb-image";
import type { TopicStory } from "./topic-stories";

/**
 * Anillo de la burbuja: `stories` = historias sin ver (degradado), `seen` = ya
 * vistas (gris), `new` = contenido nuevo en 48 h (degradado), `none` = gris.
 */
export type BubbleRing = "stories" | "seen" | "new" | "none";

/** Lo visual de una burbuja de tema (círculo + nombre), igual sea enlace al feed o botón de historias. */
export function TopicBubble({ topic, ring, active = false }: { topic: TopicStory; ring: BubbleRing; active?: boolean }) {
  const gradient = ring === "stories" || ring === "new";
  return (
    <>
      <span
        className={cn(
          "rounded-full p-[3px] transition-transform group-active:scale-95 motion-reduce:transform-none",
          gradient ? "bg-linear-to-tr from-brand-from to-brand-to" : "bg-border",
          active && "outline-2 outline-offset-2 outline-foreground",
        )}
      >
        <span className="block rounded-full bg-surface p-[2px]">
          {topic.coverUrl ? (
            <ThumbImage src={topic.coverUrl} size={60} className="h-[3.75rem] w-[3.75rem] rounded-full object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full bg-accent-soft text-lg font-black text-accent"
            >
              {topic.name.charAt(0)}
            </span>
          )}
        </span>
      </span>
      <span className={cn("w-full truncate text-center text-xs text-foreground", active && "font-bold")}>
        {topic.name}
        {ring === "new" && <span className="sr-only"> (nuevo)</span>}
      </span>
    </>
  );
}
