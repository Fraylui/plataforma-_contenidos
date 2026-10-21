"use client";

import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { PreviewImage } from "@/components/ui/preview-image";
import { PostHeader } from "../post-header";

/**
 * Portada inmersiva del detalle (spec 2026-10-21): la foto ocupa la pantalla
 * y el título va encima, sobre un degradado, como una portada de NatGeo o un
 * Reel. Sin foto (o si no carga) queda el fondo de acento con el título: la
 * página nunca abre con un hueco ni con un ícono roto.
 */
export function ImmersiveHero({
  coverUrl,
  title,
  header,
}: {
  coverUrl: string | null;
  title: string;
  /**
   * Datos del encabezado (marca, tipo, tema, hora), no un nodo ni una función:
   * este componente es de cliente y elige el color según si hay foto, y desde
   * un componente de servidor solo se le pueden pasar datos serializables.
   */
  header: Omit<ComponentProps<typeof PostHeader>, "onImage" | "className">;
}) {
  const [failed, setFailed] = useState(false);
  const photo = coverUrl != null && !failed;
  return (
    <div
      className={cn(
        "relative flex h-[70svh] max-h-[640px] min-h-[420px] w-full flex-col justify-end overflow-hidden sm:rounded-card",
        photo ? "bg-canvas-strong" : "bg-linear-to-br from-accent-soft to-canvas-strong",
      )}
    >
      {photo && (
        <>
          <PreviewImage
            src={coverUrl}
            priority
            fallback={null}
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-cover"
          />
          {/* Degradado: el texto blanco se lee sobre cualquier foto (contraste ≥ 4.5:1 abajo). */}
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" />
        </>
      )}
      <div className="relative space-y-3 p-5 sm:p-8">
        <PostHeader {...header} onImage={photo} className="flex items-center gap-3" />
        <h1
          className={cn(
            "text-[clamp(1.75rem,6vw,3rem)] leading-[1.08] font-extrabold tracking-tight text-balance",
            photo ? "text-white [text-shadow:0_1px_12px_rgb(0_0_0/0.35)]" : "text-foreground",
          )}
        >
          {title}
        </h1>
      </div>
    </div>
  );
}
