import Link from "next/link";
import type { FeedItem, FeedItemType } from "@/lib/api/types";
import { articleTypeLabel } from "@/lib/content-labels";
import { KIND_LABEL, type HomeItemKind } from "@/lib/content-kind";
import { serverImageUrl } from "@/lib/server-image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";

const HREF_PREFIX: Record<FeedItemType, string> = {
  ARTICLE: "/publicaciones",
  PLACE: "/lugares",
  EVENT: "/eventos",
};

const KIND_BY_TYPE: Record<FeedItemType, HomeItemKind> = {
  ARTICLE: "publicacion",
  PLACE: "lugar",
  EVENT: "evento",
};

function badgeFor(item: FeedItem): string {
  return item.articleType ? articleTypeLabel(item.articleType) : KIND_LABEL[KIND_BY_TYPE[item.type]];
}

/**
 * "Relacionado" en la barra lateral de la vista de detalle, mezclando
 * Publicaciones + Lugares + Eventos (ver FeedController.getRelated). Lista
 * compacta (miniatura + tipo + título), no tarjetas grandes apiladas: en
 * una columna angosta, 6 tarjetas con imagen 16:9 ocupaban más alto que el
 * propio contenido y la barra se sentía tosca. Misma anatomía que
 * NeighborNav ("Seguir leyendo"), así toda la barra lateral se lee como un
 * solo sistema.
 */
export function RelatedFeed({ items, title }: { items: FeedItem[]; title: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="text-sm font-bold tracking-tight text-foreground">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`${HREF_PREFIX[item.type]}/${item.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-canvas-border bg-surface p-2.5 transition-[border-color,box-shadow] hover:border-accent/60 hover:shadow-md"
            >
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-canvas-strong">
                {item.coverImageId ? (
                  <SkeletonImage
                    src={serverImageUrl(`/api/v1/images/${item.coverImageId}/file`)}
                    alt=""
                    className="object-cover"
                    sizes="80px"
                  />
                ) : item.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
                  <img src={item.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <NoImagePlaceholder />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-[11px] font-semibold tracking-wider text-accent uppercase">{badgeFor(item)}</span>
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                  {item.title}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
