"use client";

import { Check, Heart, PaperPlaneTilt } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useContentReactions, type LikeableContentType } from "@/components/content/like-share-bar";

const BUTTON =
  "flex size-12 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-foreground shadow-card backdrop-blur-md " +
  "transition-[transform,background-color] duration-150 hover:bg-surface active:scale-95 disabled:cursor-default";

/**
 * Me gusta y compartir flotantes del detalle inmersivo, a la derecha como en
 * Reels: siempre a mano mientras se lee. En celular van por encima de la
 * barra de pestañas y del anuncio fijo. El número solo si hay alguno.
 */
export function FloatingReactions({
  contentType,
  slug,
  initialLikeCount,
  title,
}: {
  contentType: LikeableContentType;
  slug: string;
  initialLikeCount: number;
  title: string;
}) {
  const { liked, likeCount, pending, copied, toggleLike, share } = useContentReactions({ contentType, slug, initialLikeCount, title });
  return (
    <div
      role="group"
      aria-label="Reacciones"
      className="fixed right-3 bottom-[calc(var(--bottom-bar-h)+7rem)] z-30 flex flex-col items-center gap-3 lg:right-8 lg:bottom-10"
    >
      <div className="flex flex-col items-center gap-1">
        <button type="button" onClick={() => void toggleLike()} disabled={pending} aria-pressed={liked} className={BUTTON}>
          {/* key: el ícono se vuelve a montar al cambiar y el pop corre una vez. */}
          <Heart
            key={liked ? "on" : "off"}
            weight={liked ? "fill" : "regular"}
            aria-hidden="true"
            className={cn("size-6", liked && "text-like motion-safe:animate-[like-pop_300ms_ease-out]")}
          />
          <span className="sr-only">Me gusta {likeCount > 0 ? likeCount : ""}</span>
        </button>
        {likeCount > 0 && (
          <span aria-hidden="true" className="text-xs font-semibold text-foreground tabular-nums [text-shadow:0_0_6px_var(--canvas)]">
            {likeCount}
          </span>
        )}
      </div>
      <button type="button" onClick={() => void share()} aria-label="Compartir" className={BUTTON}>
        {copied ? <Check className="size-6 text-accent" aria-hidden="true" /> : <PaperPlaneTilt className="size-6" aria-hidden="true" />}
      </button>
    </div>
  );
}
