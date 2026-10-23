"use client";

import { Star } from "@phosphor-icons/react";
import { ThumbImage } from "@/components/ui/thumb-image";
import { useStoriesOpener } from "./stories-context";

/**
 * «Destacadas · N» en la página de un tema (protección 2 de la spec): las
 * historias que el equipo guardó para que no se pierdan. Abre el mismo visor.
 * Sin visor disponible no se muestra: no hay otra página a la que llevar.
 */
export function TopicHighlights({ topicId, count, coverUrl }: { topicId: string; count: number; coverUrl: string | null }) {
  const opener = useStoriesOpener();
  if (count === 0 || !opener) return null;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onPointerEnter={opener.prefetch}
      onFocus={opener.prefetch}
      onClick={(event) => opener.open(topicId, event.currentTarget.getBoundingClientRect())}
      className="group mt-3 flex cursor-pointer items-center gap-3 rounded-full py-1 pr-4 pl-1 transition-colors hover:bg-canvas-strong"
    >
      <span className="rounded-full bg-linear-to-tr from-brand-from to-brand-to p-[2px] transition-transform group-active:scale-95 motion-reduce:transform-none">
        <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-surface">
          {coverUrl ? (
            <ThumbImage src={coverUrl} size={48} className="size-12 rounded-full object-cover" />
          ) : (
            <Star weight="fill" className="size-5 text-accent" aria-hidden="true" />
          )}
        </span>
      </span>
      <span className="text-sm font-semibold text-foreground">{`Destacadas · ${count}`}</span>
    </button>
  );
}
