import Link from "next/link";
import { Eye, Heart, ImageSquare } from "@phosphor-icons/react/dist/ssr";
import type { ContentImage } from "@/lib/api/types";
import type { EngagementCounts } from "@/lib/api/admin-types";
import { imageUrl } from "@/lib/image-url";

const NUMBER = new Intl.NumberFormat("es-PE", { notation: "compact" });

/** URL de la primera imagen del contenido (subida o por enlace), o null. */
export function coverUrl(images: ContentImage[]): string | null {
  const cover = images[0];
  if (!cover) return null;
  if (cover.imageId) return imageUrl(`/api/v1/images/${cover.imageId}/file`);
  return cover.externalUrl;
}

/** Celda de título de los listados: miniatura de la portada + enlace a editar. */
export function TitleCell({ href, title, images }: { href: string; title: string; images: ContentImage[] }) {
  const cover = coverUrl(images);
  return (
    <Link href={href} className="group flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-field text-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura del backend o enlace externo, igual que image-card.tsx
          <img src={cover} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <ImageSquare className="size-5" aria-hidden="true" />
        )}
      </span>
      <span className="line-clamp-2 max-w-[22rem] font-medium [overflow-wrap:anywhere] text-foreground group-hover:text-accent group-hover:underline">
        {title}
      </span>
    </Link>
  );
}

/** Visitas y me gusta totales de una fila (texto + ícono, legible sin color). */
export function EngagementCell({ counts }: { counts: EngagementCounts | undefined }) {
  const views = counts?.views ?? 0;
  const likes = counts?.likes ?? 0;
  return (
    <span className="inline-flex items-center gap-3 text-xs tabular-nums text-muted">
      <span className="inline-flex items-center gap-1" title={`${views} visitas`}>
        <Eye className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Visitas:</span>
        {NUMBER.format(views)}
      </span>
      <span className="inline-flex items-center gap-1" title={`${likes} me gusta`}>
        <Heart className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Me gusta:</span>
        {NUMBER.format(likes)}
      </span>
    </span>
  );
}
