import {
  getFeed,
  getFeedTopics,
  getLiveNow,
  getPlatformSettings,
  getPrimaryNavVisibility,
  getTopLiked,
  listActiveAdPlacements,
  listActiveCategories,
  listPublishedCelebrations,
  listTodayCelebrations,
  listActiveStories,
} from "@/lib/api/client";
import type { AdSection } from "@/lib/ads/ad-context";
import { fromFeedItem } from "@/lib/home-items";
import { serverImageUrl } from "@/lib/server-image-url";
import { LiveBanner } from "@/components/live/live-banner";
import { TodayCelebrations } from "@/components/celebrations/today-celebrations";
import { toTodayCelebration } from "@/lib/today-celebrations";
import { TopicStories, type TopicStory } from "./topic-stories";
import { mergeTopicsWithStories } from "@/components/stories/merge-topics";
import { StoriesLauncher } from "@/components/stories/stories-launcher";
import { FilterChips } from "./filter-chips";
import { typeChipOptions } from "./type-chips";
import { Feed } from "./feed";
import { RightColumn } from "./right-column";
import type { FeedFilter } from "./use-feed-pages";
import { orNull, orDefault } from "@/lib/server-log";

const FEED_INITIAL_SIZE = 12;
const UPCOMING_CELEBRATIONS_SIZE = 4;

/**
 * Pantalla de feed, la misma para el inicio, las secciones (Publicaciones,
 * Lugares, Galerías), Celebraciones y cada tema — como Instagram o
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
  const celebrationsFeed = filter.sort === "upcoming";
  // «Hoy se celebra» va en el inicio y en Celebraciones; no en cada sección ni tema.
  const showToday = activePath === "/" || celebrationsFeed;
  const [settings, categories, topics, feedPage, upcoming, visibility, placements, topLikedRaw, liveNow, todayCelebrations, activeStories] = await Promise.all([
    getPlatformSettings(),
    listActiveCategories(),
    getFeedTopics().catch(orDefault("inicio.temas", [])),
    getFeed({ size: FEED_INITIAL_SIZE, seed, ...filter }),
    // En Celebraciones las próximas ya son el feed: la columna no las repite.
    celebrationsFeed ? Promise.resolve({ items: [] }) : listPublishedCelebrations({ when: "upcoming", size: UPCOMING_CELEBRATIONS_SIZE }),
    getPrimaryNavVisibility(),
    listActiveAdPlacements(),
    getTopLiked(5).catch(orDefault("inicio.mas-gustado", [])),
    // Si el backend de En vivo falla, el feed sigue: solo no se muestra el aviso.
    getLiveNow().catch(orNull("inicio.en-vivo")),
    showToday ? listTodayCelebrations().catch(orDefault("inicio.hoy-se-celebra", [])) : Promise.resolve([]),
    // Historias solo en el Inicio; si fallan, la fila queda como la de temas de siempre.
    activePath === "/" ? listActiveStories().catch(orDefault("inicio.historias", [])) : Promise.resolve([]),
  ]);

  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const topicBubbles: TopicStory[] = topics.map((t) => ({
    categoryId: t.categoryId,
    name: t.name,
    slug: t.slug,
    coverUrl: t.coverImageId ? serverImageUrl(`/api/v1/images/${t.coverImageId}/file`) : t.coverImageUrl,
    hasNew: t.hasNew,
  }));
  const storyImage = (imageId: string | null) => (imageId ? serverImageUrl(`/api/v1/images/${imageId}/file`) : null);
  const stories = mergeTopicsWithStories(topicBubbles, activeStories, (story) => storyImage(story.imageId));
  // Fotos de las historias resueltas aquí (next/image las pide al backend desde el servidor de Next).
  const storyImageSrc: Record<string, string> = Object.fromEntries(
    activeStories.flatMap((topic) => topic.stories).flatMap((story) => {
      const src = storyImage(story.imageId);
      return src ? [[story.id, src]] : [];
    }),
  );
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
            {liveNow && <LiveBanner stream={liveNow} />}
            {showToday && <TodayCelebrations initial={todayCelebrations.map(toTodayCelebration)} />}
            <StoriesLauncher topics={activeStories} imageSrc={storyImageSrc} recent={feedPage.items.slice(0, 6).map(fromFeedItem)}>
              <TopicStories topics={stories} activeCategoryId={activeCategoryId} />
            </StoriesLauncher>
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
          <RightColumn celebrations={upcoming.items} topLiked={topLiked} categoryNames={categoryNames} adSection={adSection} />
        </div>
      </aside>
    </div>
  );
}
