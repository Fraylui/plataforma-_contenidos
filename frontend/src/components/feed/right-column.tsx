import Link from "next/link";
import type { EventSummary } from "@/lib/api/types";
import type { HomeItem } from "@/lib/home-items";
import { EventRowCard } from "@/components/home/event-row-card";
import { TopLikedList } from "@/components/content/top-liked-list";
import { AdBlock } from "@/components/legal/ad-block";

/**
 * Columna derecha del feed en escritorio ancho (≥ 1280 px), como la de
 * sugerencias de Instagram: próximos eventos, "Lo más gustado" y un
 * anuncio. En celular estos bloques viven en la pestaña Agenda y dentro
 * del propio feed.
 */
export function RightColumn({
  events,
  topLiked,
  categoryNames,
}: {
  events: EventSummary[];
  topLiked: HomeItem[];
  categoryNames: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-6">
      {events.length > 0 && (
        <section aria-labelledby="proximos-eventos">
          <div className="flex items-center justify-between">
            <h2 id="proximos-eventos" className="text-sm font-bold text-foreground">
              Próximos eventos
            </h2>
            <Link href="/eventos" className="text-xs font-semibold text-accent hover:underline">
              Ver agenda
            </Link>
          </div>
          <ul className="mt-2 flex flex-col">
            {events.map((event) => (
              <li key={event.id}>
                <EventRowCard event={event} categoryName={categoryNames[event.categoryId]} compact bordered={false} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {topLiked.length >= 3 && <TopLikedList items={topLiked} />}
      <AdBlock position="listing" layout="fill" section="HOME" />
    </div>
  );
}
