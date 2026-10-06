"use client";

import { useId, useRef } from "react";
import Link from "next/link";
import { Check, Heart, PaperPlaneTilt } from "@phosphor-icons/react";
import type { HomeItem } from "@/lib/home-items";
import { homeLikeType } from "@/lib/content-kind";
import { useContentReactions } from "@/components/content/like-share-bar";
import { cn } from "@/lib/utils";
import { PostHeader, type PostBrand } from "./post-header";
import { PostMedia } from "./post-media";
import { typeActions } from "./post-actions";

const ICON_BUTTON =
  "inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-foreground transition-colors hover:bg-canvas disabled:cursor-default";

/**
 * Publicación del feed, estilo Instagram (diseño 2026-10-06): encabezado de
 * la marca, medio cuadrado con carrusel y doble toque = me gusta, barra de
 * acciones (me gusta, compartir y la acción útil del tipo) y el texto como
 * pie: título en negrita y dos líneas. Sin antetítulo, sin bajada larga,
 * sin botón "Ver".
 */
export function PostCard({
  item,
  brand,
  categoryName,
  priority = false,
}: {
  item: HomeItem;
  brand: PostBrand;
  categoryName?: string;
  priority?: boolean;
}) {
  const titleId = useId();
  const { liked, likeCount, pending, copied, toggleLike, share } = useContentReactions({
    contentType: homeLikeType(item.kind),
    slug: item.slug,
    initialLikeCount: item.likeCount,
    title: item.title,
    path: item.href,
  });
  // El doble toque solo da "me gusta" (como Instagram): este ref evita que
  // dos dobles toques seguidos lo quiten antes de que vuelva la respuesta.
  const likedByTap = useRef(false);

  function likeFromDoubleTap() {
    if (liked || likedByTap.current) return;
    likedByTap.current = true;
    void toggleLike();
  }

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const actions = typeActions(item, `${origin}${item.href}`);

  return (
    <article
      aria-labelledby={titleId}
      className="overflow-hidden border-b border-border/70 bg-surface sm:rounded-2xl sm:border sm:shadow-[0_1px_2px_rgb(0_0_0_/_0.04)]"
    >
      <PostHeader item={item} brand={brand} categoryName={categoryName} />
      <PostMedia images={item.images} title={item.title} href={item.href} onDoubleTap={likeFromDoubleTap} priority={priority} />

      <div className="flex items-center gap-1 px-2 pt-1.5">
        <button
          type="button"
          onClick={() => {
            likedByTap.current = false;
            void toggleLike();
          }}
          disabled={pending}
          aria-pressed={liked}
          aria-label={liked ? "Quitar me gusta" : "Me gusta"}
          className={ICON_BUTTON}
        >
          <Heart
            className={cn("h-6 w-6 transition-transform motion-safe:active:scale-90", liked && "text-red-500")}
            weight={liked ? "fill" : "regular"}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold tabular-nums">{likeCount}</span>
        </button>
        <button type="button" onClick={() => void share()} aria-label="Compartir" className={ICON_BUTTON}>
          {copied ? <Check className="h-6 w-6 text-accent" aria-hidden="true" /> : <PaperPlaneTilt className="h-6 w-6" aria-hidden="true" />}
        </button>
        {actions.length > 0 && (
          <div className="ml-auto flex flex-wrap justify-end gap-1.5 pr-1">
            {actions.map(({ label, href, icon: Icon, external }) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[13px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-1 pb-4">
        <h2 id={titleId} className="text-[15px] leading-snug font-bold text-foreground">
          <Link href={item.href} className="hover:underline">
            {item.title}
          </Link>
        </h2>
        {item.excerpt && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.excerpt}</p>}
      </div>
    </article>
  );
}
