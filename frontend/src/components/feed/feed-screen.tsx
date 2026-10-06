import {
  getFeed,
  getFeedTopics,
  getPlatformSettings,
  getPrimaryNavVisibility,
  getTopLiked,
  listActiveAdPlacements,
  listActiveCategories,
  listPublishedEvents,
} from "@/lib/api/client";
import type { AdSection } from "@/lib/ads/ad-context";
import { fromFeedItem } from "@/lib/home-items";
import { imageUrl } from "@/lib/image-url";
import { TopicStories, type TopicStory } from "./topic-stories";
import { FilterChips } from "./filter-chips";
import { typeChipOptions } from "./type-chips";
import { Feed } from "./feed";
import { RightColumn } from "./right-column";
import type { FeedFilter } from "./use-feed-pages";

const FEED_INITIAL_SIZE = 12;
const UPCOMING_EVENTS_SIZE = 4;

/**
 * Pantalla de feed, la misma para el inicio, las secciones (Publicaciones,
 * Lugares, Galerías, Directorio), la Agenda y cada tema — como Instagram o
 * Facebook, donde filtrar no cambia de diseño: círculos de temas, chips de
 * tipo, feed de una columna con scroll infinito y, en escritorio ancho,
 * columna derecha pegada al borde. Sin portadas de sección, contadores ni
 * desplegables "Filtrar por tema" (eso era un diario).
 *
 * SEO: el primer lote sale en el HTML (12 enlaces) y el sitemap.xml lista
 * todo el contenido; el feed avanza excluyendo lo visto, no por número de
 * página, así que no hay enlaces `?page=`.
 *
 * Semilla por hora (no por visita): todos los que entran en la misma hora
 * ven el mismo orden, así la página se puede cachear (Next, nginx,
 * Cloudflare); el resto del scroll no repite (exclude).
 */
export async function FeedScreen({
  heading,
  filter,
  activePath,
  activeCategoryId,
  adSection,
  emptyMessage,
  intro,
}: {
  /** Único <h1> de la pantalla (fuera de pantalla: el título visible está en la franja superior). */
  heading: string;
  filter: FeedFilter;
  /** Ruta del chip de tipo activo ("/" = Todo). */
  activePath: string;
  /** Círculo de tema activo (pantalla de un tema). */
  activeCategoryId?: string;
  adSection: AdSection;
  emptyMessage?: string;
  /** Encabezado visible de la pantalla de un tema (como la página de un hashtag en Instagram): nombre y descripción. */
  intro?: { title: string; description: string | null };
}) {
  const seed = `${activePath}${filter.categoryId ?? ""}-${new Date().toISOString().slice(0, 13)}`;
  const agenda = filter.sort === "upcoming";
  const [settings, categories, topics, feedPage, events, visibility, placements, topLikedRaw] = await Promise.all([
    getPlatformSettings(),
    listActiveCategories(),
    getFeedTopics().catch(() => []),
    getFeed({ size: FEED_INITIAL_SIZE, seed, ...filter }),
    // En la Agenda los próximos eventos ya son el feed: la columna no los repite.
    agenda ? Promise.resolve({ items: [] }) : listPublishedEvents({ when: "upcoming", size: UPCOMING_EVENTS_SIZE }),
    getPrimaryNavVisibility(),
    listActiveAdPlacements(),
    getTopLiked(5).catch(() => []),
  ]);

  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const stories: TopicStory[] = topics.map((t) => ({
    categoryId: t.categoryId,
    name: t.name,
    slug: t.slug,
    coverUrl: t.coverImageId ? imageUrl(`/api/v1/images/${t.coverImageId}/file`) : t.coverImageUrl,
    hasNew: t.hasNew,
  }));
  const topLiked = topLikedRaw.map(fromFeedItem);
  const feedSlot = placements.find((p) => p.key === "en-feed")?.adsenseSlotId;
  const feedAd =
    settings.adsenseEnabled && settings.adsenseClientId && feedSlot ? { clientId: settings.adsenseClientId, slot: feedSlot } : null;

  return (
    // Como Facebook: el feed se centra en el espacio libre y la columna derecha queda pegada al borde de la pantalla, sin franjas vacías a los costados.
    <div className="flex w-full">
      <div className="flex min-w-0 flex-1 justify-center py-3 sm:px-4 sm:py-6">
        <div className="w-full max-w-[630px] min-w-0">
          {intro ? (
            <header className="px-4 pb-2 sm:px-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{intro.title}</h1>
              {intro.description && <p className="mt-1 text-[15px] text-muted">{intro.description}</p>}
            </header>
          ) : (
            <h1 className="sr-only">{heading}</h1>
          )}
          <div className="px-4 sm:px-0">
            <TopicStories topics={stories} activeCategoryId={activeCategoryId} />
            <FilterChips label="Tipo de contenido" options={typeChipOptions(visibility, activePath)} className="mt-2 mb-3" />
          </div>
          <Feed
            initialItems={feedPage.items.map(fromFeedItem)}
            initialHasMore={feedPage.hasMore}
            seed={seed}
            filter={filter}
            brand={{ name: settings.name, logoUrl: settings.logoUrl ?? null }}
            categoryNames={categoryNames}
            feedAd={feedAd}
            topLiked={topLiked}
            adSection={adSection}
            emptyMessage={emptyMessage}
          />
        </div>
      </div>
      <aside aria-label="Más para descubrir" className="hidden w-[22.5rem] shrink-0 xl:block">
        {/* Alto de pantalla bajo la franja superior (h-16), con desplazamiento propio sin barra visible. */}
        <div className="sticky top-16 h-[calc(100dvh-4rem)] overflow-y-auto px-5 py-6 no-scrollbar">
          <RightColumn events={events.items} topLiked={topLiked} categoryNames={categoryNames} adSection={adSection} />
        </div>
      </aside>
    </div>
  );
}
