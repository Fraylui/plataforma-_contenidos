"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useEmblaCarousel from "embla-carousel-react";
import { CaretLeft, CaretRight, Heart } from "@phosphor-icons/react";
import type { HomeImage } from "@/lib/home-items";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { cn } from "@/lib/utils";

/** Espera para distinguir un toque (abrir el post) de un doble toque (me gusta). */
const TAP_DELAY_MS = 250;

/**
 * Medio de la tarjeta, cuadrado 1:1 (sin CLS): una imagen o carrusel con
 * puntos (embla, deslizable con el dedo; flechas en escritorio al pasar el
 * mouse). Un toque abre el post; doble toque = me gusta, con corazón que
 * aparece en el centro (sin animación si el sistema pide menos movimiento).
 * Sin imagen: bloque de marca con el título — nunca un hueco gris.
 */
export function PostMedia({
  images,
  title,
  href,
  onDoubleTap,
  priority = false,
}: {
  images: HomeImage[];
  title: string;
  href: string;
  onDoubleTap: () => void;
  priority?: boolean;
}) {
  const router = useRouter();
  const tapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [burst, setBurst] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);
  useEffect(() => () => clearTimeout(tapTimer.current), []);

  function handleClick() {
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => router.push(href), TAP_DELAY_MS);
  }
  function handleDoubleClick() {
    clearTimeout(tapTimer.current);
    setBurst((n) => n + 1);
    onDoubleTap();
  }

  const many = images.length > 1;

  return (
    <div
      data-testid="post-media"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className="group relative aspect-square cursor-pointer touch-manipulation overflow-hidden bg-canvas-strong select-none"
    >
      {images.length === 0 ? (
        <div data-testid="post-media-fallback" className="flex h-full items-center justify-center bg-linear-to-br from-accent-soft to-canvas-strong p-8">
          <p className="text-center text-2xl leading-tight font-extrabold text-balance text-foreground">{title}</p>
        </div>
      ) : (
        <div className="h-full" ref={emblaRef}>
          <div className="flex h-full">
            {images.map((image, index) => (
              <div key={`${image.url}-${index}`} className="relative h-full min-w-0 flex-[0_0_100%]">
                {image.isExternal ? (
                  // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado en el panel, host arbitrario
                  <img
                    src={image.url}
                    alt={index === 0 ? title : ""}
                    loading={priority && index === 0 ? "eager" : "lazy"}
                    // Mismo trato que next/image con priority: es la imagen principal (LCP) de la pantalla.
                    fetchPriority={priority && index === 0 ? "high" : "auto"}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <SkeletonImage
                    src={image.url}
                    alt={index === 0 ? title : ""}
                    sizes="(min-width: 640px) 620px, 100vw"
                    priority={priority && index === 0}
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {many && (
        <>
          <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
            {selected + 1}/{images.length}
          </span>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={(e) => {
              e.stopPropagation();
              emblaApi?.scrollPrev();
            }}
            className="absolute top-1/2 left-2 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:flex"
          >
            <CaretLeft className="h-4 w-4" weight="bold" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={(e) => {
              e.stopPropagation();
              emblaApi?.scrollNext();
            }}
            className="absolute top-1/2 right-2 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:flex"
          >
            <CaretRight className="h-4 w-4" weight="bold" aria-hidden="true" />
          </button>
          {/* Punto visible de 6 px dentro de un botón de 24 px: fácil de tocar (WCAG 2.5.8) sin agrandar el diseño. */}
          <div className="absolute inset-x-0 bottom-1.5 flex justify-center">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Ir a la imagen ${index + 1} de ${images.length}`}
                aria-current={index === selected}
                onClick={(e) => {
                  e.stopPropagation();
                  emblaApi?.scrollTo(index);
                }}
                className="flex h-6 w-6 cursor-pointer items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className={cn("h-1.5 w-1.5 rounded-full transition-colors", index === selected ? "bg-white" : "bg-white/50")}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {burst > 0 && (
        <Heart
          key={burst}
          weight="fill"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 drop-shadow-lg motion-safe:animate-[heart-pop_800ms_ease-out]"
        />
      )}
    </div>
  );
}
