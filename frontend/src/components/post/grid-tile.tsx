import Link from "next/link";
import { CalendarBlank, Heart, Play, SquaresFour } from "@phosphor-icons/react/dist/ssr";
import type { HomeItem } from "@/lib/home-items";
import { SkeletonImage } from "@/components/ui/skeleton-image";

/**
 * Miniatura cuadrada de la cuadrícula (Explorar, "Más como esto", resultados
 * de búsqueda), como la de Instagram: ícono arriba a la derecha si es
 * carrusel, video o evento, y al pasar el mouse los me gusta. Sin imagen:
 * bloque de color con el título.
 */
export function GridTile({ item }: { item: HomeItem }) {
  const cover = item.images[0] ?? (item.imageUrl ? { url: item.imageUrl, isExternal: item.imageIsExternal } : null);
  const badge =
    item.hasVideo ? { icon: Play, label: "Video" } :
    item.kind === "evento" ? { icon: CalendarBlank, label: "Evento" } :
    item.images.length > 1 ? { icon: SquaresFour, label: "Varias imágenes" } :
    null;

  return (
    <Link
      href={item.href}
      aria-label={`${item.title} · ${item.typeLabel}`}
      className="group relative block aspect-square overflow-hidden bg-canvas-strong focus-visible:z-10"
    >
      {cover ? (
        cover.isExternal ? (
          // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado en el panel, host arbitrario
          <img src={cover.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <SkeletonImage src={cover.url} alt="" sizes="(min-width: 1024px) 340px, 33vw" className="object-cover" />
        )
      ) : (
        <span className="flex h-full items-center justify-center bg-linear-to-br from-accent-soft to-canvas-strong p-3 text-center text-sm leading-tight font-bold text-foreground">
          {item.title}
        </span>
      )}
      {badge && (
        <badge.icon
          weight="fill"
          role="img"
          aria-label={badge.label}
          className="absolute top-2 right-2 h-5 w-5 text-white drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.6)]"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0 hidden items-center justify-center gap-1.5 bg-black/35 text-sm font-bold text-white group-hover:flex"
      >
        <Heart weight="fill" className="h-5 w-5" />
        {item.likeCount}
      </span>
    </Link>
  );
}
