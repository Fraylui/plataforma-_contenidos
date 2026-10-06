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
import { fromFeedItem } from "@/lib/home-items";
import { imageUrl } from "@/lib/image-url";
import { TopicStories, type TopicStory } from "@/components/feed/topic-stories";
import { FilterChips } from "@/components/feed/filter-chips";
import { typeChipOptions } from "@/components/feed/type-chips";
import { Feed } from "@/components/feed/feed";
import { RightColumn } from "@/components/feed/right-column";

const FEED_INITIAL_SIZE = 12;
const UPCOMING_EVENTS_SIZE = 4;

/**
 * Inicio = feed estilo Instagram (diseño 2026-10-06): círculos de temas,
 * chips de tipo y publicaciones de una columna con scroll infinito; en
 * escritorio ancho, columna derecha con próximos eventos, lo más gustado y
 * un anuncio. Sin portada rotativa, franja de módulos ni bloques por tema:
 * eso era la estructura de un diario.
 *
 * Semilla del feed por hora (no por visita): todos los que entran en la
 * misma hora ven el mismo orden, así la página se puede guardar en caché
 * (Next, nginx, Cloudflare); el resto del scroll no repite (exclude).
 */
export default async function Home() {
  const feedSeed = new Date().toISOString().slice(0, 13);
  const [settings, categories, topics, feedPage, events, visibility, placements, topLikedRaw] = await Promise.all([
    getPlatformSettings(),
    listActiveCategories(),
    getFeedTopics().catch(() => []),
    getFeed({ size: FEED_INITIAL_SIZE, seed: feedSeed }),
    listPublishedEvents({ when: "upcoming", size: UPCOMING_EVENTS_SIZE }),
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
  const feedItems = feedPage.items.map(fromFeedItem);
  const topLiked = topLikedRaw.map(fromFeedItem);
  const feedSlot = placements.find((p) => p.key === "en-feed")?.adsenseSlotId;
  const feedAd =
    settings.adsenseEnabled && settings.adsenseClientId && feedSlot ? { clientId: settings.adsenseClientId, slot: feedSlot } : null;
  const brand = { name: settings.name, logoUrl: settings.logoUrl ?? null };

  return (
    <div className="mx-auto flex w-full max-w-[1040px] justify-center gap-10 py-3 sm:px-4 sm:py-6">
      <div className="w-full max-w-[630px] min-w-0">
        {/* Único <h1>, fuera de pantalla: la marca ya se ve en la navegación. */}
        <h1 className="sr-only">{settings.name}</h1>
        <div className="px-4 sm:px-0">
          <TopicStories topics={stories} />
          <FilterChips label="Tipo de contenido" options={typeChipOptions(visibility, "/")} className="mt-2 mb-3" />
        </div>
        <Feed
          initialItems={feedItems}
          initialHasMore={feedPage.hasMore}
          seed={feedSeed}
          filter={{}}
          brand={brand}
          categoryNames={categoryNames}
          feedAd={feedAd}
          topLiked={topLiked}
        />
      </div>
      <aside aria-label="Más para descubrir" className="hidden w-80 shrink-0 xl:block">
        <div className="sticky top-24">
          <RightColumn events={events.items} topLiked={topLiked} categoryNames={categoryNames} />
        </div>
      </aside>
    </div>
  );
}
