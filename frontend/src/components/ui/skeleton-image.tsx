"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * next/image (fill) + skeleton pulsante mientras carga. Siempre dentro de un
 * contenedor `relative` con aspect-ratio fijo (fill se posiciona absoluto y
 * llena ese contenedor) — CardMedia es Server Component, así que el estado
 * de "cargando" vive acá, el único punto que sí necesita ser Client Component.
 */
export function SkeletonImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-zinc-100" aria-hidden="true" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        className={cn(className, "transition-[opacity,transform] duration-300", loaded ? "opacity-100" : "opacity-0")}
      />
    </>
  );
}
