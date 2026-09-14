"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MediaCaption({ title, caption }: { title: string | null; caption: string | null }) {
  if (!title && !caption) return null;
  return (
    <figcaption className="mt-2 text-sm text-muted">
      {title && <span className="font-medium text-foreground">{title}</span>}
      {title && caption && " — "}
      {caption}
    </figcaption>
  );
}

/**
 * Carrusel deslizable estilo Instagram compartido por ContentImageGallery y
 * ContentVideoGallery — un slide a la vez, flechas + puntos, pie de foto del
 * ítem visible. Recibe los slides ya renderizados (Server Components como
 * ContentImageDisplay/YouTubeEmbed) porque este componente en sí es "use
 * client" solo por el estado del carrusel, no por cómo se resuelve cada
 * imagen/video.
 */
export function MediaCarousel({
  spacing,
  background,
  slides,
  captions,
  prevLabel,
  nextLabel,
  dotLabelPrefix,
}: {
  spacing: string;
  background: string;
  slides: ReactNode[];
  captions: { title: string | null; caption: string | null }[];
  prevLabel: string;
  nextLabel: string;
  /** Prefijo del aria-label de cada punto — el número de slide se agrega acá (no se puede pasar una función server→client). */
  dotLabelPrefix: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const current = captions[selectedIndex];

  return (
    <div className={spacing}>
      <div className={`relative overflow-hidden rounded-2xl border border-border ${background} shadow-lg`}>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {slides.map((slide, index) => (
              <div key={index} className="relative min-w-0 flex-[0_0_100%]">
                {slide}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label={prevLabel}
          className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          aria-label={nextLabel}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="absolute right-0 bottom-3 left-0 flex justify-center gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`${dotLabelPrefix} ${index + 1}`}
              aria-current={index === selectedIndex}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                index === selectedIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
      {current && <MediaCaption title={current.title} caption={current.caption} />}
    </div>
  );
}
