"use client";

import { Check, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContentReactions, type LikeableContentType } from "./like-share-bar";

/**
 * Reacciones compactas para tarjetas: Me gusta (con contador, persistido en
 * el backend por visitorId anónimo) y Compartir (Web Share API nativa o
 * copiar enlace) — mismos datos y comportamiento que LikeShareBar de la
 * página de detalle, en formato de íconos. Sin "Guardar": esta plataforma
 * no tiene cuentas de usuario (nadie necesita loguearse para leer nada), y
 * sin una cuenta no hay dónde mostrarle a alguien su lista de guardados
 * después — sería un botón que no lleva a ningún lado. Botones de 36 px
 * (mínimo táctil razonable dentro de una tarjeta) y `relative z-10` para
 * quedar encima del enlace estirado de la tarjeta, así tocar el corazón no
 * navega.
 */
export function CardActions({
  contentType,
  slug,
  initialLikeCount,
  title,
  path,
}: {
  contentType: LikeableContentType;
  slug: string;
  initialLikeCount: number;
  title: string;
  path: string;
}) {
  const { liked, likeCount, pending, copied, toggleLike, share } = useContentReactions({
    contentType,
    slug,
    initialLikeCount,
    title,
    path,
  });
  const button = "relative z-10 inline-flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1 rounded-lg px-1.5 text-muted transition-colors hover:bg-accent-soft hover:text-accent";

  return (
    <div className="-ml-1.5 flex items-center" aria-label="Reacciones">
      <button
        type="button"
        onClick={toggleLike}
        disabled={pending}
        aria-pressed={liked}
        aria-label={`Me gusta (${likeCount})`}
        className={cn(button, liked && "text-accent")}
      >
        <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        <span className="text-xs font-semibold tabular-nums">{likeCount}</span>
      </button>
      <button type="button" onClick={share} aria-label={copied ? "Enlace copiado" : "Compartir"} className={button}>
        {copied ? <Check className="h-4 w-4 text-accent" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
