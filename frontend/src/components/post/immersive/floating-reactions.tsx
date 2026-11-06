"use client";

import { useEffect, useState } from "react";
import { Check, PaperPlaneTilt } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { FeedItemType } from "@/lib/api/types";
import { useContentReactions, type LikeableContentType } from "@/components/content/like-share-bar";
import { ReactionButton } from "@/components/content/reaction-button";
import { useReaction } from "@/components/content/use-reaction";

/** Tras dejar de mover el scroll, cuánto tardan en volver los botones. */
const REAPPEAR_MS = 700;

/**
 * En celular los botones flotan sobre el texto: se apartan mientras se baja
 * leyendo y vuelven al subir o al detenerse (como la barra de muchas apps).
 */
function useHiddenWhileReading(): boolean {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function onScroll() {
      const y = window.scrollY;
      if (y > lastY + 4) setHidden(true);
      else if (y < lastY - 4) setHidden(false);
      lastY = y;
      clearTimeout(timer);
      timer = setTimeout(() => setHidden(false), REAPPEAR_MS);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);
  return hidden;
}

const BUTTON =
  "flex size-12 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-foreground shadow-card backdrop-blur-md " +
  "transition-[scale,background-color] duration-150 hover:bg-surface active:scale-95 disabled:cursor-default";

/**
 * Reaccionar y compartir flotantes del detalle inmersivo, a la derecha como
 * en Reels: siempre a mano mientras se lee. Las cuatro reacciones en una
 * bandeja (ReactionButton), sincronizadas con «¿Qué te pareció?». En celular van por encima de la
 * barra de pestañas y del anuncio fijo, y se apartan mientras se baja
 * (useHiddenWhileReading); en escritorio quedan fuera del texto, fijos. El
 * número solo si hay alguno.
 */
export function FloatingReactions({
  type,
  id,
  contentType,
  slug,
  initialLikeCount,
  title,
}: {
  type: FeedItemType;
  id: string;
  contentType: LikeableContentType;
  slug: string;
  initialLikeCount: number;
  title: string;
}) {
  const { copied, share } = useContentReactions({ contentType, slug, initialLikeCount, title });
  const reaction = useReaction({ type, id, likeKey: slug, initialCounts: { LOVE: initialLikeCount } });
  const hidden = useHiddenWhileReading();
  return (
    <div
      role="group"
      aria-label="Reacciones"
      data-hidden={hidden}
      className={cn(
        "fixed right-3 bottom-[calc(var(--bottom-bar-h)+7rem)] z-30 flex flex-col items-center gap-3 lg:right-8 lg:bottom-10",
        // Pantalla ancha: al costado del post (ver PostView), fijos mientras se lee.
        "xl:sticky xl:top-[45vh] xl:right-auto xl:bottom-auto",
        "transition-[translate,opacity] duration-200 ease-out motion-reduce:transition-none",
        hidden && "pointer-events-none translate-x-[150%] opacity-0 lg:pointer-events-auto lg:translate-x-0 lg:opacity-100",
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <ReactionButton variant="floating" mine={reaction.mine} counts={reaction.counts} onReact={(next) => void reaction.react(next)} />
        {reaction.total > 0 && (
          <span aria-hidden="true" className="text-xs font-semibold text-foreground tabular-nums [text-shadow:0_0_6px_var(--canvas)]">
            {reaction.total}
          </span>
        )}
      </div>
      <button type="button" onClick={() => void share()} aria-label="Compartir" className={BUTTON}>
        {copied ? <Check className="size-6 text-accent" aria-hidden="true" /> : <PaperPlaneTilt className="size-6" aria-hidden="true" />}
      </button>
    </div>
  );
}
