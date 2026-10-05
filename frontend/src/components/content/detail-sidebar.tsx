import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTopLiked, listPublishedEvents } from "@/lib/api/client";
import type { FeedItem } from "@/lib/api/types";
import { fromFeedItem } from "@/lib/home-items";
import { AdBlock } from "@/components/legal/ad-block";
import { RelatedFeed } from "@/components/content/related-feed";
import { TopLikedList } from "@/components/content/top-liked-list";
import { EventRowCard } from "@/components/home/event-row-card";

const UPCOMING_EVENTS = 3;

/**
 * Columna lateral del detalle (Publicación, Lugar, Evento), con el patrón
 * de MSN y los sitios de contenidos:
 *  - Arriba, listas útiles: relacionados del tema, "Quizás te interese"
 *    para completar, "Lo más gustado" y la agenda.
 *  - Abajo, el anuncio queda fijo y acompaña al lector por el resto del
 *    texto (`sticky` dentro de una columna que mide lo mismo que el
 *    artículo) — es el formato de mejor visibilidad para AdSense.
 * Antes todo iba fijo arriba (un anuncio + a veces UN relacionado) y el
 * resto de la columna quedaba vacío a lo largo de todo el texto.
 */
export async function DetailSidebar({
  related,
  more,
  relatedTitle,
  categoryNames,
  currentId,
  showEvents = true,
}: {
  related: FeedItem[];
  more: FeedItem[];
  relatedTitle: string;
  categoryNames: Record<string, string>;
  /** Contenido que se está viendo: no se repite en "Lo más gustado" ni en la agenda. */
  currentId: string;
  showEvents?: boolean;
}) {
  const [topLikedRaw, events] = await Promise.all([
    getTopLiked(6).catch(() => []),
    showEvents
      ? listPublishedEvents({ when: "upcoming", size: UPCOMING_EVENTS + 1 }).catch(() => null)
      : Promise.resolve(null),
  ]);
  const topLiked = topLikedRaw.filter((item) => item.id !== currentId).map(fromFeedItem);
  const upcoming = (events?.items ?? []).filter((event) => event.id !== currentId).slice(0, UPCOMING_EVENTS);

  return (
    <aside className="mt-14 flex flex-col gap-10 lg:col-span-4 lg:mt-0">
      <RelatedFeed items={related} title={relatedTitle} categoryNames={categoryNames} />
      <RelatedFeed items={more} title="Quizás te interese" categoryNames={categoryNames} />

      {topLiked.length >= 3 && <TopLikedList items={topLiked} />}

      {upcoming.length > 0 && (
        <section aria-label="Próximos eventos">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold tracking-tight text-foreground">Próximos eventos</h2>
            <Link
              href="/eventos"
              className="-my-3 inline-flex items-center gap-1 py-3 text-[12px] font-semibold text-accent hover:underline"
            >
              Agenda completa
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-2 flex flex-col divide-y divide-foreground/[0.06]">
            {upcoming.map((event) => (
              <li key={event.id}>
                <EventRowCard event={event} categoryName={categoryNames[event.categoryId]} compact bordered={false} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="lg:sticky lg:top-32">
        <AdBlock position="listing" className="aspect-[16/9] rounded-2xl" />
      </div>
    </aside>
  );
}
