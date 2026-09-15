import {
  getFeed,
  getPlatformSettings,
  listActiveCategories,
  listPublishedArticles,
  listPublishedEvents,
  listPublishedGalleries,
  listPublishedPlaces,
} from "@/lib/api/client";
import { fromArticle, fromEvent, fromFeedItem, fromGallery, fromPlace, sortNewestFirst, type HomeItem } from "@/lib/home-items";
import { HeroRotator } from "@/components/home/hero-rotator";
import { InfiniteFeed } from "@/components/home/infinite-feed";
import { HomeSidebar } from "@/components/home/home-sidebar";

// Cuántos traer de cada tipo: alcanza para el hero (4, uno por tipo,
// priorizando los que tienen imagen) sin pedir listados enormes.
const ARTICLES_SIZE = 12;
const PLACES_SIZE = 8;
const GALLERIES_SIZE = 6;
const UPCOMING_EVENTS_SIZE = 5;

const HERO_SIZE = 4;
// Primer lote del scroll infinito (ver InfiniteFeed) — el resto lo pide el cliente a medida que se acerca al final.
const FEED_INITIAL_SIZE = 12;

/**
 * Hero: un contenido por tipo (el más nuevo de cada uno, priorizando los
 * que tienen imagen) para que la rotación muestre la variedad de la
 * plataforma, no 4 publicaciones seguidas.
 */
function pickHero(byKind: HomeItem[][]): HomeItem[] {
  const withImage = byKind.map((list) => list.find((i) => i.imageUrl)).filter((i): i is HomeItem => Boolean(i));
  const picked = withImage.slice(0, HERO_SIZE);
  if (picked.length < HERO_SIZE) {
    for (const list of byKind) {
      for (const item of list) {
        if (picked.length >= HERO_SIZE) break;
        if (!picked.some((p) => p.id === item.id)) picked.push(item);
      }
    }
  }
  // Lo más reciente siempre primero: es el slide inicial y el que ve quien
  // no espera la rotación.
  return sortNewestFirst(picked);
}

/**
 * Home = hero + dos columnas: el feed con scroll infinito a la izquierda y
 * una barra lateral fija (agenda de eventos, anuncio, categorías) a la
 * derecha — la estructura de un sitio de contenidos con AdSense, no una
 * sucesión de secciones apiladas hasta el fondo (CONTEXTO.md sección 43).
 */
export default async function Home() {
  const [articles, places, galleries, events, categories, settings] = await Promise.all([
    listPublishedArticles({ size: ARTICLES_SIZE }),
    listPublishedPlaces({ size: PLACES_SIZE }),
    listPublishedGalleries({ size: GALLERIES_SIZE }),
    listPublishedEvents({ when: "upcoming", size: UPCOMING_EVENTS_SIZE }),
    listActiveCategories(),
    getPlatformSettings(),
  ]);

  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const hero = pickHero([
    articles.items.map(fromArticle),
    places.items.map(fromPlace),
    galleries.items.map(fromGallery),
    events.items.map(fromEvent),
  ]);
  const heroIds = new Set(hero.map((i) => i.id));

  // Scroll infinito (Publicaciones + Lugares + Eventos, ver FeedService en
  // el backend): primer lote acá para que el render inicial y el SEO de la
  // portada no dependan de JS; sin repetir lo que ya se ve en el hero.
  const feedSeed = crypto.randomUUID();
  const feedPage = await getFeed({ size: FEED_INITIAL_SIZE, exclude: [...heroIds], seed: feedSeed });
  const feedItems = feedPage.items.map(fromFeedItem);

  const isEmpty = hero.length === 0;

  return (
    <div className="flex flex-col">
      {/* Único <h1> de la página, fuera de pantalla: el header ya muestra la marca. */}
      <h1 className="sr-only">{settings.name}</h1>

      {isEmpty ? (
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-canvas-border px-6 py-16 text-center">
            <p className="text-sm text-muted">Todavía no hay contenido publicado. Vuelve pronto.</p>
          </div>
        </div>
      ) : (
        <HeroRotator items={hero} categoryNames={categoryNames} />
      )}

      {(feedItems.length > 0 || events.items.length > 0) && (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:grid lg:grid-cols-12 lg:gap-10 lg:px-8">
          {/* En celular la barra lateral va ANTES del feed (order-first): después
              de un scroll infinito nunca se llegaría a verla. */}
          <aside className="order-first mb-10 lg:order-none lg:col-span-4 lg:mb-0">
            <div className="lg:sticky lg:top-24">
              <HomeSidebar events={events.items} categories={categories} categoryNames={categoryNames} />
            </div>
          </aside>

          {feedItems.length > 0 && (
            <section aria-labelledby="descubre" className="lg:col-span-8 lg:row-start-1">
              <div className="flex flex-col gap-1">
                <h2 id="descubre" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  Descubre en {settings.shortName || settings.name}
                </h2>
                <p className="hidden text-sm text-muted sm:block">Publicaciones, lugares y eventos, sin repetirse mientras exploras.</p>
              </div>

              <div className="mt-4 sm:mt-5">
                <InfiniteFeed
                  initialItems={feedItems}
                  initialHasMore={feedPage.hasMore}
                  seed={feedSeed}
                  categoryNames={categoryNames}
                />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
