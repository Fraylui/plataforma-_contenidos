"use client";

import { useId, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, PaperPlaneTilt } from "@phosphor-icons/react";
import type { HomeItem } from "@/lib/home-items";
import { homeLikeType, type HomeItemKind } from "@/lib/content-kind";
import { useContentReactions } from "@/components/content/like-share-bar";
import { ReactionButton } from "@/components/content/reaction-button";
import { useReaction } from "@/components/content/use-reaction";
import type { FeedItemType } from "@/lib/api/types";
import { PostHeader, headerTimeFor, type PostBrand } from "./post-header";
import { PostMedia } from "./post-media";
import { GalleryMosaic } from "./gallery-mosaic";
import { CelebrationStamp } from "./immersive/celebration-stamp";
import { typeActions } from "./post-actions";

const noSubscribe = () => () => {};

const REACTION_TYPE: Record<HomeItemKind, FeedItemType> = {
  publicacion: "PUBLICATION",
  lugar: "PLACE",
  celebracion: "CELEBRATION",
  galeria: "GALLERY",
  episodio: "EPISODE",
};

const ICON_BUTTON =
  "inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-foreground transition-colors hover:bg-canvas disabled:cursor-default";

/**
 * Publicación del feed, estilo Instagram (diseño 2026-10-06): encabezado de
 * la marca, medio cuadrado con carrusel y doble toque = ❤️ Me encanta, barra
 * de acciones (reaccionar, compartir y la acción útil del tipo) y el texto
 * como pie: título en negrita y dos líneas. Sin antetítulo, sin bajada
 * larga, sin botón "Ver". Desde 2026-11-05 no hay corazón aparte: las
 * cuatro reacciones están aquí mismo (ReactionButton) y ❤️ es el «me gusta».
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
  const { copied, share } = useContentReactions({
    contentType: homeLikeType(item.kind),
    slug: item.likeKey,
    initialLikeCount: item.likeCount,
    title: item.title,
    path: item.href,
  });
  const reaction = useReaction({
    type: REACTION_TYPE[item.kind],
    id: item.id,
    likeKey: item.likeKey,
    initialCounts: { ...item.reactions, LOVE: item.reactions?.LOVE ?? item.likeCount },
  });
  // El doble toque solo pone ❤️ (como Instagram), nunca quita ni cambia otra
  // reacción: este ref evita que dos dobles toques seguidos la quiten.
  const lovedByTap = useRef(false);

  function loveFromDoubleTap() {
    if (reaction.mine || lovedByTap.current) return;
    lovedByTap.current = true;
    void reaction.react("LOVE");
  }

  // En el servidor no hay origen: "" y React lo completa al hidratar, sin
  // diferencia entre el HTML y el cliente (antes leía window en el render).
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
  const actions = typeActions(item, `${origin}${item.href}`);

  return (
    <article
      aria-labelledby={titleId}
      className="overflow-hidden bg-surface sm:rounded-card sm:shadow-card"
    >
      <PostHeader brand={brand} typeLabel={item.typeLabel} categoryName={categoryName} time={headerTimeFor(item)} />
      {item.kind === "galeria" && item.images.length >= 3 ? (
        <GalleryMosaic images={item.images} title={item.title} href={item.href} priority={priority} />
      ) : (
        <PostMedia
          images={item.images}
          title={item.title}
          href={item.href}
          onDoubleTap={loveFromDoubleTap}
          priority={priority}
          overlay={item.kind === "celebracion" && item.startsAt ? <CelebrationStamp nextAt={item.startsAt} /> : undefined}
        />
      )}

      <div className="flex items-center gap-1 px-2 pt-1.5">
        <ReactionButton
          mine={reaction.mine}
          counts={reaction.counts}
          onReact={(next) => {
            lovedByTap.current = false;
            void reaction.react(next);
          }}
        />
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
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-canvas-strong px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-accent-soft hover:text-accent"
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
